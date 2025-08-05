import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { CreateContactData, ContextState } from '@shared/types';

export const CONTACTS_QUERY_KEY = 'contacts';
export const CONTACT_STATS_QUERY_KEY = 'contact-stats';

export function useContacts(params?: {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  contextState?: string;
  assignedTo?: string;
  priority?: string;
  tags?: string;
}) {
  return useQuery({
    queryKey: [CONTACTS_QUERY_KEY, params],
    queryFn: () => apiService.getContacts(params),
    select: (response) => response.data.data,
    staleTime: 30000, // 30 seconds
  });
}

export function useContact(id: string) {
  return useQuery({
    queryKey: [CONTACTS_QUERY_KEY, id],
    queryFn: () => apiService.getContact(id),
    select: (response) => response.data.data?.contact,
    enabled: !!id,
  });
}

export function useContactStats() {
  return useQuery({
    queryKey: [CONTACT_STATS_QUERY_KEY],
    queryFn: () => apiService.getContactStats(),
    select: (response) => response.data.data,
    staleTime: 60000, // 1 minute
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contactData: CreateContactData) => 
      apiService.createContact(contactData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CONTACTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [CONTACT_STATS_QUERY_KEY] });
    },
    onError: (error: any) => {
      console.error('Contact creation error:', error);
      if (error.response?.data) {
        console.error('Error response:', error.response.data);
      }
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateContactData> }) => {
      console.log('=== FRONTEND UPDATE CONTACT DEBUG ===');
      console.log('Contact ID:', id);
      console.log('Update data:', JSON.stringify(data, null, 2));
      return apiService.updateContact(id, data);
    },
    onSuccess: (response, { id }) => {
      console.log('Contact update successful:', response);
      queryClient.invalidateQueries({ queryKey: [CONTACTS_QUERY_KEY] });
      queryClient.setQueryData([CONTACTS_QUERY_KEY, id], response);
      queryClient.invalidateQueries({ queryKey: [CONTACT_STATS_QUERY_KEY] });
    },
    onError: (error: any, { id, data }) => {
      console.error('=== FRONTEND UPDATE CONTACT ERROR ===');
      console.error('Contact ID:', id);
      console.error('Update data that failed:', JSON.stringify(data, null, 2));
      console.error('Error details:', error);
      if (error.response?.data) {
        console.error('Error response from server:', error.response.data);
        console.error('Server error details:', JSON.stringify(error.response.data, null, 2));
      }
      if (error.response?.status) {
        console.error('HTTP status code:', error.response.status);
      }
      console.error('=== FRONTEND UPDATE CONTACT ERROR END ===');
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiService.deleteContact(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CONTACTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [CONTACT_STATS_QUERY_KEY] });
    },
  });
}

export function useAddInteraction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      contactId, 
      interaction 
    }: { 
      contactId: string; 
      interaction: {
        type: 'call' | 'email' | 'meeting' | 'note' | 'tour' | 'ai_conversation';
        subject?: string;
        content: string;
        metadata?: {
          aiModel?: string;
          aiContext?: string;
          duration?: number;
          outcome?: string;
          nextActions?: string[];
        };
      };
    }) => apiService.addInteraction(contactId, interaction),
    onSuccess: (response, { contactId }) => {
      console.log('✅ Interaction added successfully:', response.data);
      // Invalidate the contacts list to refresh it
      queryClient.invalidateQueries({ queryKey: [CONTACTS_QUERY_KEY] });
      // Update the specific contact data with the new interaction
      queryClient.setQueryData([CONTACTS_QUERY_KEY, contactId], response.data);
      // Also invalidate contact stats as they might include recent interactions
      queryClient.invalidateQueries({ queryKey: [CONTACT_STATS_QUERY_KEY] });
    },
    onError: (error: any, { contactId, interaction }) => {
      console.error('❌ Failed to add interaction:', error);
      console.error('Contact ID:', contactId);
      console.error('Interaction data:', interaction);
      if (error.response?.data) {
        console.error('Server error response:', error.response.data);
      }
    },
  });
}

export function useUpdateContextState() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      contactId, 
      contextState, 
      reason 
    }: { 
      contactId: string; 
      contextState: ContextState; 
      reason?: string; 
    }) => apiService.updateContextState(contactId, { contextState, reason }),
    onSuccess: (response, { contactId }) => {
      queryClient.invalidateQueries({ queryKey: [CONTACTS_QUERY_KEY] });
      queryClient.setQueryData([CONTACTS_QUERY_KEY, contactId], response.data);
      queryClient.invalidateQueries({ queryKey: [CONTACT_STATS_QUERY_KEY] });
    },
  });
}