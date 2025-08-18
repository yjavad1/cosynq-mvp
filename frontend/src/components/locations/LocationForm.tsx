import { Fragment, useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useForm, Controller } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import {
  X,
  Plus,
  Trash2,
  MapPin,
  Clock,
  Phone,
  Building,
  Star,
  AlertCircle,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
// Note: AxiosError removed due to axios type export issues
import {
  Location,
  CreateLocationData,
  AmenityType,
  DayOfWeek,
  LocationContact,
} from "@shared/types";
import {
  useCreateLocation,
  useUpdateLocation,
  getAmenityDisplayName,
  getAmenityIcon,
} from "../../hooks/useLocations";

interface LocationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  location?: Location; // For editing
  isOnboarding?: boolean; // Whether this form is part of onboarding flow
  onOnboardingNext?: () => void; // Callback for onboarding next step
}

// ApiErrorResponse interface removed due to AxiosError type export issues

const availableAmenities: AmenityType[] = [
  "WiFi",
  "AC",
  "Parking",
  "Coffee",
  "Security",
  "Reception",
  "Kitchen",
  "Printer",
  "Scanner",
  "Whiteboard",
  "Projector",
  "Conference_Room",
  "Phone_Booth",
  "Lounge",
  "Gym",
  "Shower",
  "Bike_Storage",
  "Mail_Service",
  "Cleaning_Service",
  "Catering",
  "Event_Space",
  "Terrace",
  "Garden",
  "Handicap_Accessible",
];

const days: { key: DayOfWeek; label: string }[] = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

/**
 * Recursively removes all _id fields from an object and its nested properties
 * Handles arrays, nested objects, and preserves all other data
 */
const removeMongoIds = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(removeMongoIds);
  }

  if (typeof obj === 'object') {
    const cleaned: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      // Skip _id fields entirely
      if (key === '_id') {
        continue;
      }
      
      // Recursively clean nested objects and arrays
      cleaned[key] = removeMongoIds(value);
    }
    
    return cleaned;
  }

  // Return primitive values as-is
  return obj;
};

const contactTypes = [
  { value: "phone", label: "Phone" },
  { value: "email", label: "Email" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "emergency", label: "Emergency" },
];

export function LocationForm({
  isOpen,
  onClose,
  onSuccess,
  location,
  isOnboarding = false,
  onOnboardingNext,
}: LocationFormProps) {
  const [selectedAmenities, setSelectedAmenities] = useState<AmenityType[]>([]);
  const [contacts, setContacts] = useState<LocationContact[]>([
    { type: "phone", value: "", isPrimary: true },
  ]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState<boolean>(false);
  const [isSubmittingForm, setIsSubmittingForm] = useState<boolean>(false);

  const navigate = useNavigate();
  const isEditing = !!location;
  const createLocation = useCreateLocation();
  const updateLocation = useUpdateLocation();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<CreateLocationData>({
    defaultValues: {
      timezone: "Asia/Kolkata",
      isActive: true,
      allowSameDayBooking: true,
      totalFloors: 1,
      totalCapacity: undefined, // Optional field
      operatingHours: days.map((day) => ({
        day: day.key,
        isOpen: !["saturday", "sunday"].includes(day.key),
        openTime: "09:00",
        closeTime: "18:00",
      })),
      defaultBookingRules: {
        minimumBookingDuration: 60,
        maximumBookingDuration: 480,
        advanceBookingLimit: 30,
      },
    },
  });

  useEffect(() => {
    if (location) {
      // Pre-populate form with location data for editing
      reset({
        name: location.name,
        description: location.description || "",
        code: location.code,
        address: location.address,
        operatingHours: location.operatingHours,
        timezone: location.timezone,
        totalFloors: location.totalFloors,
        totalCapacity: location.totalCapacity,
        isActive: location.isActive,
        allowSameDayBooking: location.allowSameDayBooking,
        defaultBookingRules: location.defaultBookingRules,
        images: location.images,
        virtualTourUrl: location.virtualTourUrl,
      });
      setSelectedAmenities(location.amenities || []);
      setContacts(
        location.contacts.length > 0
          ? location.contacts
          : [{ type: "phone", value: "", isPrimary: true }]
      );
    }
    // Clear any previous error and success message when opening/closing the form or switching locations
    setSubmitError(null);
    setShowSuccessMessage(false);
    setIsSubmittingForm(false);
  }, [location, reset, isOpen]);

  const handleAmenityToggle = (amenity: AmenityType) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
    );
  };

  const addContact = () => {
    setContacts((prev) => [
      ...prev,
      { type: "phone", value: "", isPrimary: false },
    ]);
  };

  const removeContact = (index: number) => {
    if (contacts.length > 1) {
      setContacts((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const updateContact = (
    index: number,
    field: keyof LocationContact,
    value: any
  ) => {
    setContacts((prev) =>
      prev.map((contact, i) =>
        i === index ? { ...contact, [field]: value } : contact
      )
    );
  };

  const setPrimaryContact = (index: number) => {
    setContacts((prev) =>
      prev.map((contact, i) => ({
        ...contact,
        isPrimary: i === index,
      }))
    );
  };

  const onSubmit = async (data: CreateLocationData) => {
    // Clear any previous error and start submission
    setSubmitError(null);
    setShowSuccessMessage(false);
    setIsSubmittingForm(true);

    try {
      // Frontend validation for required fields
      const requiredFields = [
        {
          field: data.name,
          message: "Location name is required and must be unique",
        },
        {
          field: data.code,
          message: "Location code is required and must be unique",
        },
        { field: data.address?.street, message: "Street address is required" },
        { field: data.address?.city, message: "City is required" },
        { field: data.address?.state, message: "State is required" },
        { field: data.address?.zipCode, message: "ZIP code is required" },
      ];

      for (const { field, message } of requiredFields) {
        if (!field || field.trim() === "") {
          setSubmitError(message);
          setIsSubmittingForm(false);
          return;
        }
      }

      // Additional validation for unique name and code format
      if (data.name.trim().length < 2) {
        setSubmitError("Location name must be at least 2 characters long");
        setIsSubmittingForm(false);
        return;
      }

      if (data.code.trim().length < 2) {
        setSubmitError("Location code must be at least 2 characters long");
        setIsSubmittingForm(false);
        return;
      }

      // Filter out empty contacts
      const validContacts = contacts.filter((c) => c.value.trim() !== "");

      // Check if we have at least one valid contact
      if (validContacts.length === 0) {
        setSubmitError(
          "Please provide at least one contact (phone or email) for the location."
        );
        setIsSubmittingForm(false);
        return;
      }

      // Prepare form data with valid contacts and selected amenities
      const formDataWithContacts: CreateLocationData = {
        ...data,
        // Ensure number fields are proper numbers or undefined, never null
        totalFloors:
          data.totalFloors && typeof data.totalFloors === "number"
            ? data.totalFloors
            : 1,
        totalCapacity:
          data.totalCapacity && typeof data.totalCapacity === "number"
            ? data.totalCapacity
            : undefined,
        contacts: validContacts,
        amenities: selectedAmenities,
      };

      // *** COMPREHENSIVE _ID REMOVAL: Remove ALL MongoDB _id fields recursively ***
      const cleanedData: CreateLocationData = removeMongoIds(formDataWithContacts);

      // *** ENHANCED DEBUGGING ***
      console.log("=== LOCATION FORM DEBUG ===");
      console.log("Original form data:", JSON.stringify(data, null, 2));
      console.log("Form data with contacts/amenities:", JSON.stringify(formDataWithContacts, null, 2));
      console.log("Final cleaned data (no _id fields):", JSON.stringify(cleanedData, null, 2));
      
      // Verify no _id fields remain
      const hasIdFields = JSON.stringify(cleanedData).includes('"_id"');
      console.log("Contains _id fields after cleaning:", hasIdFields);
      
      if (hasIdFields) {
        console.error("WARNING: _id fields still present in cleaned data!");
      }

      if (isEditing && location) {
        await updateLocation.mutateAsync({
          id: location._id,
          locationData: cleanedData,
        });
      } else {
        await createLocation.mutateAsync(cleanedData);
      }

      setIsSubmittingForm(false);

      // Handle successful creation/update
      if (isOnboarding && !isEditing) {
        setShowSuccessMessage(true);
        const onboardingProgress = JSON.parse(
          localStorage.getItem("cosynq_onboarding_progress") || "{}"
        );
        onboardingProgress.locationsAdded = true;
        onboardingProgress.completedSteps =
          onboardingProgress.completedSteps || [];
        if (!onboardingProgress.completedSteps.includes("locations")) {
          onboardingProgress.completedSteps.push("locations");
        }
        localStorage.setItem(
          "cosynq_onboarding_progress",
          JSON.stringify(onboardingProgress)
        );
      } else {
        onSuccess();
      }
    } catch (error: unknown) {
      console.error("Failed to save location:", error);
      setIsSubmittingForm(false);

      if (error && typeof error === "object" && "isAxiosError" in error) {
        const axiosError = error as any; // Using any due to axios type export issues

        if (axiosError.response?.status === 409) {
          const errorMessage =
            axiosError.response?.data?.message ||
            "A location with this name or code already exists. Please choose a different one.";
          setSubmitError(errorMessage);
        } else if (axiosError.response?.data?.message) {
          setSubmitError(axiosError.response.data.message);
        } else {
          setSubmitError(
            "Failed to save location. Please check your connection and try again."
          );
        }
      } else {
        setSubmitError("Failed to save location. Please try again.");
      }
    }
  };

  const handleProceedToSpaces = () => {
    // Call onboarding next callback if provided
    if (onOnboardingNext) {
      onOnboardingNext();
    } else {
      // Navigate to spaces page
      navigate("/spaces");
    }

    // Close the form after navigation
    onSuccess();
  };

  const handleAddAnotherLocation = () => {
    // Reset form for adding another location
    setShowSuccessMessage(false);
    setSubmitError(null);
    reset({
      timezone: "Asia/Kolkata",
      isActive: true,
      allowSameDayBooking: true,
      totalFloors: 1,
      totalCapacity: undefined,
      operatingHours: days.map((day) => ({
        day: day.key,
        isOpen: !["saturday", "sunday"].includes(day.key),
        openTime: "09:00",
        closeTime: "18:00",
      })),
      defaultBookingRules: {
        minimumBookingDuration: 60,
        maximumBookingDuration: 480,
        advanceBookingLimit: 30,
      },
    });
    setSelectedAmenities([]);
    setContacts([{ type: "phone", value: "", isPrimary: true }]);
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6 max-h-screen overflow-y-auto">
                <div className="absolute top-0 right-0 pt-4 pr-4">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="w-full">
                    <Dialog.Title
                      as="h3"
                      className="text-lg leading-6 font-medium text-gray-900 mb-6"
                    >
                      {isEditing ? "Edit Location" : "Create New Location"}
                    </Dialog.Title>

                    {/* Error Message Display */}
                    {submitError && !showSuccessMessage && (
                      <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <AlertCircle className="h-5 w-5 text-red-400" />
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">
                              Error saving location
                            </h3>
                            <div className="mt-2 text-sm text-red-700">
                              {submitError}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Success Message Display - Only for onboarding */}
                    {showSuccessMessage && isOnboarding && (
                      <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-6">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <CheckCircle className="h-6 w-6 text-green-400" />
                          </div>
                          <div className="ml-3">
                            <h3 className="text-lg font-medium text-green-800 mb-2">
                              Location created successfully!
                            </h3>
                            <p className="text-sm text-green-700 mb-4">
                              Your location has been added to your workspace.
                              You can now proceed to configure space types or
                              add more locations.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3">
                              <button
                                onClick={handleProceedToSpaces}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                              >
                                <ArrowRight className="h-4 w-4 mr-2" />
                                Continue to Space Types
                              </button>
                              <button
                                onClick={handleAddAnotherLocation}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Another Location
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Hide form when showing success message in onboarding */}
                    {!(showSuccessMessage && isOnboarding) && (
                      <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="space-y-8"
                      >
                        {/* Basic Information */}
                        <div>
                          <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                            <Building className="h-5 w-5 mr-2 text-gray-400" />
                            Basic Information
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Location Name *
                              </label>
                              <input
                                {...register("name", {
                                  required: "Location name is required",
                                })}
                                type="text"
                                className="block w-full border border-gray-300 rounded-md px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g., Bangalore Main Office"
                              />
                              {errors.name && (
                                <p className="mt-1 text-sm text-red-600">
                                  {errors.name.message}
                                </p>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Location Code *
                              </label>
                              <input
                                {...register("code", {
                                  required: "Location code is required",
                                  pattern: {
                                    value: /^[A-Z0-9_]+$/,
                                    message:
                                      "Code must contain only uppercase letters, numbers, and underscores",
                                  },
                                })}
                                type="text"
                                className="block w-full border border-gray-300 rounded-md px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g., BLR01"
                                style={{ textTransform: "uppercase" }}
                              />
                              {errors.code && (
                                <p className="mt-1 text-sm text-red-600">
                                  {errors.code.message}
                                </p>
                              )}
                            </div>

                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                              </label>
                              <textarea
                                {...register("description")}
                                rows={3}
                                className="block w-full border border-gray-300 rounded-md px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Brief description of the location..."
                              />
                            </div>
                          </div>
                        </div>

                        {/* Address */}
                        <div>
                          <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                            <MapPin className="h-5 w-5 mr-2 text-gray-400" />
                            Address
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Street Address *
                              </label>
                              <input
                                {...register("address.street", {
                                  required: "Street address is required",
                                })}
                                type="text"
                                className="block w-full border border-gray-300 rounded-md px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                City *
                              </label>
                              <input
                                {...register("address.city", {
                                  required: "City is required",
                                })}
                                type="text"
                                className="block w-full border border-gray-300 rounded-md px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                State *
                              </label>
                              <input
                                {...register("address.state", {
                                  required: "State is required",
                                })}
                                type="text"
                                className="block w-full border border-gray-300 rounded-md px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                ZIP Code *
                              </label>
                              <input
                                {...register("address.zipCode", {
                                  required: "ZIP code is required",
                                })}
                                type="text"
                                className="block w-full border border-gray-300 rounded-md px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Country
                              </label>
                              <input
                                {...register("address.country")}
                                type="text"
                                className="block w-full border border-gray-300 rounded-md px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                defaultValue="India"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Floor/Unit
                              </label>
                              <input
                                {...register("address.floor")}
                                type="text"
                                className="block w-full border border-gray-300 rounded-md px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g., 2nd Floor"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Unit Number
                              </label>
                              <input
                                {...register("address.unitNumber")}
                                type="text"
                                className="block w-full border border-gray-300 rounded-md px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g., Suite 201"
                              />
                            </div>

                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Landmark
                              </label>
                              <input
                                {...register("address.landmark")}
                                type="text"
                                className="block w-full border border-gray-300 rounded-md px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g., Near XYZ Mall"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Contact Information */}
                        <div>
                          <h4 className="text-md font-medium text-gray-900 mb-2 flex items-center">
                            <Phone className="h-5 w-5 mr-2 text-gray-400" />
                            Contact Information
                          </h4>
                          <p className="text-sm text-gray-600 mb-4">
                            At least one contact (phone or email) is required
                            for the location.
                          </p>
                          <div className="space-y-3">
                            {contacts.map((contact, index) => (
                              <div
                                key={index}
                                className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end"
                              >
                                <div className="md:col-span-3">
                                  <select
                                    value={contact.type}
                                    onChange={(e) =>
                                      updateContact(
                                        index,
                                        "type",
                                        e.target.value
                                      )
                                    }
                                    className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                  >
                                    {contactTypes.map((type) => (
                                      <option
                                        key={type.value}
                                        value={type.value}
                                      >
                                        {type.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="md:col-span-4">
                                  <input
                                    type="text"
                                    value={contact.value}
                                    onChange={(e) =>
                                      updateContact(
                                        index,
                                        "value",
                                        e.target.value
                                      )
                                    }
                                    className={`block w-full border rounded-md px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                                      index === 0 && contacts.length === 1
                                        ? "border-blue-300 bg-blue-50"
                                        : "border-gray-300"
                                    }`}
                                    placeholder={`${
                                      contact.type === "email"
                                        ? "email@example.com"
                                        : "+1 234 567 8900"
                                    }${
                                      index === 0 && contacts.length === 1
                                        ? " (required)"
                                        : ""
                                    }`}
                                  />
                                </div>
                                <div className="md:col-span-3">
                                  <input
                                    type="text"
                                    value={contact.label || ""}
                                    onChange={(e) =>
                                      updateContact(
                                        index,
                                        "label",
                                        e.target.value
                                      )
                                    }
                                    className="block w-full border border-gray-300 rounded-md px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Label (optional)"
                                  />
                                </div>
                                <div className="md:col-span-2 flex items-center space-x-2">
                                  <label className="flex items-center">
                                    <input
                                      type="radio"
                                      checked={contact.isPrimary}
                                      onChange={() => setPrimaryContact(index)}
                                      className="text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="ml-1 text-sm text-gray-700">
                                      Primary
                                    </span>
                                  </label>
                                  {contacts.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => removeContact(index)}
                                      className="text-red-600 hover:text-red-800"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={addContact}
                              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add Contact
                            </button>
                          </div>
                        </div>

                        {/* Operating Hours */}
                        <div>
                          <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                            <Clock className="h-5 w-5 mr-2 text-gray-400" />
                            Operating Hours
                          </h4>
                          <div className="space-y-3">
                            {days.map((day, index) => (
                              <div
                                key={day.key}
                                className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center"
                              >
                                <div className="md:col-span-3">
                                  <span className="text-sm font-medium text-gray-700">
                                    {day.label}
                                  </span>
                                </div>
                                <div className="md:col-span-2">
                                  <Controller
                                    name={`operatingHours.${index}.isOpen`}
                                    control={control}
                                    render={({ field }) => (
                                      <label className="flex items-center">
                                        <input
                                          type="checkbox"
                                          name={field.name}
                                          ref={field.ref}
                                          onBlur={field.onBlur}
                                          onChange={field.onChange}
                                          checked={field.value}
                                          className="text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <span className="ml-2 text-sm text-gray-700">
                                          Open
                                        </span>
                                      </label>
                                    )}
                                  />
                                </div>
                                <div className="md:col-span-3">
                                  <input
                                    {...register(
                                      `operatingHours.${index}.openTime`
                                    )}
                                    type="time"
                                    disabled={
                                      !watch(`operatingHours.${index}.isOpen`)
                                    }
                                    className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                                  />
                                </div>
                                <div className="md:col-span-1 text-center">
                                  <span className="text-gray-500">to</span>
                                </div>
                                <div className="md:col-span-3">
                                  <input
                                    {...register(
                                      `operatingHours.${index}.closeTime`
                                    )}
                                    type="time"
                                    disabled={
                                      !watch(`operatingHours.${index}.isOpen`)
                                    }
                                    className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Timezone
                            </label>
                            <select
                              {...register("timezone")}
                              className="block w-full md:w-1/2 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="Asia/Kolkata">
                                Asia/Kolkata (IST)
                              </option>
                              <option value="America/New_York">
                                America/New_York (EST)
                              </option>
                              <option value="America/Los_Angeles">
                                America/Los_Angeles (PST)
                              </option>
                              <option value="Europe/London">
                                Europe/London (GMT)
                              </option>
                              <option value="Asia/Tokyo">
                                Asia/Tokyo (JST)
                              </option>
                              <option value="Australia/Sydney">
                                Australia/Sydney (AEDT)
                              </option>
                            </select>
                          </div>
                        </div>

                        {/* Amenities */}
                        <div>
                          <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                            <Star className="h-5 w-5 mr-2 text-gray-400" />
                            Amenities ({selectedAmenities.length} selected)
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {availableAmenities.map((amenity) => (
                              <label
                                key={amenity}
                                className={`
                                relative flex items-center p-3 rounded-lg cursor-pointer border-2 transition-colors
                                ${
                                  selectedAmenities.includes(amenity)
                                    ? "border-blue-500 bg-blue-50"
                                    : "border-gray-200 hover:border-gray-300"
                                }
                              `}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedAmenities.includes(amenity)}
                                  onChange={() => handleAmenityToggle(amenity)}
                                  className="sr-only"
                                />
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm">
                                    {getAmenityIcon(amenity)}
                                  </span>
                                  <span className="text-sm font-medium text-gray-900">
                                    {getAmenityDisplayName(amenity)}
                                  </span>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Additional Settings */}
                        <div>
                          <h4 className="text-md font-medium text-gray-900 mb-4">
                            Additional Settings
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Total Capacity
                              </label>
                              <input
                                {...register("totalCapacity", {
                                  valueAsNumber: true,
                                  validate: (value) => {
                                    // Allow undefined (empty field) or valid numbers
                                    return (
                                      value === undefined ||
                                      (typeof value === "number" &&
                                        value > 0) ||
                                      "Must be a positive number"
                                    );
                                  },
                                  setValueAs: (value) => {
                                    // Convert empty string to undefined to avoid null
                                    if (
                                      value === "" ||
                                      value === null ||
                                      value === undefined
                                    )
                                      return undefined;
                                    const num = Number(value);
                                    return isNaN(num) ? undefined : num;
                                  },
                                })}
                                type="number"
                                min="1"
                                className="block w-full border border-gray-300 rounded-md px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g., 200"
                              />
                              {errors.totalCapacity && (
                                <p className="mt-1 text-sm text-red-600">
                                  {errors.totalCapacity.message}
                                </p>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Total Floors
                              </label>
                              <input
                                {...register("totalFloors", {
                                  valueAsNumber: true,
                                  validate: (value) => {
                                    // totalFloors should have a default of 1, so validate it's a positive number
                                    return (
                                      (typeof value === "number" &&
                                        value > 0) ||
                                      "Must be a positive number"
                                    );
                                  },
                                  setValueAs: (value) => {
                                    // Convert empty string to 1 (default), avoid null
                                    if (
                                      value === "" ||
                                      value === null ||
                                      value === undefined
                                    )
                                      return 1;
                                    const num = Number(value);
                                    return isNaN(num) ? 1 : Math.max(1, num);
                                  },
                                })}
                                type="number"
                                min="1"
                                className="block w-full border border-gray-300 rounded-md px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g., 3"
                              />
                              {errors.totalFloors && (
                                <p className="mt-1 text-sm text-red-600">
                                  {errors.totalFloors.message}
                                </p>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Virtual Tour URL
                              </label>
                              <input
                                {...register("virtualTourUrl")}
                                type="url"
                                className="block w-full border border-gray-300 rounded-md px-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="https://..."
                              />
                            </div>

                            <div className="flex items-center space-x-6">
                              <label className="flex items-center">
                                <input
                                  {...register("isActive")}
                                  type="checkbox"
                                  className="text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-700">
                                  Active
                                </span>
                              </label>

                              <label className="flex items-center">
                                <input
                                  {...register("allowSameDayBooking")}
                                  type="checkbox"
                                  className="text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-700">
                                  Allow Same-day Booking
                                </span>
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* Form Actions */}
                        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                          <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={
                              isSubmitting ||
                              isSubmittingForm ||
                              showSuccessMessage
                            }
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSubmitting || isSubmittingForm
                              ? "Saving..."
                              : isEditing
                              ? "Update Location"
                              : "Create Location"}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
