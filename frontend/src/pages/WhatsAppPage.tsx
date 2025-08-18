import React, { useState } from "react";
import { Link } from "react-router-dom";
import { MessageSquare, Send, Phone, Users, Clock, Home, BarChart3 } from "lucide-react";
import {
  useWhatsAppStatus,
  useSendWhatsAppMessage,
  useWhatsAppConversations,
} from "../hooks/useWhatsApp";
import { WhatsAppConversation } from "@shared/types";

export function WhatsAppPage() {
  const [newMessage, setNewMessage] = useState({
    toNumber: "",
    messageBody: "",
  });
  const [showSendForm, setShowSendForm] = useState(false);

  const { data: status, isLoading: statusLoading } = useWhatsAppStatus();
  const { data: conversations, isLoading: conversationsLoading } =
    useWhatsAppConversations();
  const sendMessage = useSendWhatsAppMessage();

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.toNumber || !newMessage.messageBody) return;

    try {
      await sendMessage.mutateAsync(newMessage);
      setNewMessage({ toNumber: "", messageBody: "" });
      setShowSendForm(false);
      // Show success message
      alert("✅ Message sent successfully!");
    } catch (error: any) {
      console.error("Failed to send message:", error);
      // Show user-friendly error message
      const errorMessage = error.response?.data?.message || error.message || "Failed to send message";
      alert(`❌ ${errorMessage}`);
    }
  };

  if (statusLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!status?.data?.enabled) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            WhatsApp Service Unavailable
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            The WhatsApp service is currently disabled.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <MessageSquare className="h-8 w-8 text-green-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">WhatsApp</h1>
              <p className="text-gray-600">
                Business messaging and customer communication
              </p>
            </div>
          </div>
          <div className="flex space-x-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Link>
            <Link
              to="/analytics"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Link>
            <button
              onClick={() => setShowSendForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
            >
              <Send className="h-5 w-5 mr-2" />
              Send Message
            </button>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Phone className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      WhatsApp Number
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {status.data.twilioNumber}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <MessageSquare className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Messages
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {status.data.stats.totalMessages}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Conversations
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {status.data.stats.totalConversations}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Conversations */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Recent Conversations
            </h3>

            {conversationsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : conversations?.data?.conversations?.length > 0 ? (
              <div className="space-y-4">
                {conversations.data.conversations.map((conversation: WhatsAppConversation) => (
                  <div
                    key={conversation._id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="bg-green-100 rounded-full p-2">
                          <Phone className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {conversation.latestMessage.fromNumber ===
                            status.data.twilioNumber
                              ? conversation.latestMessage.toNumber
                              : conversation.latestMessage.fromNumber}
                          </p>
                          <p className="text-sm text-gray-500 truncate max-w-md">
                            {conversation.latestMessage.messageBody}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(conversation.lastActivity).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {conversation.messageCount} messages
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No conversations yet
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Start by sending your first WhatsApp message!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Send Message Modal */}
        {showSendForm && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 bg-gray-500 bg-opacity-75"
                onClick={() => setShowSendForm(false)}
              />

              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <form onSubmit={handleSendMessage}>
                  <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Send WhatsApp Message
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={newMessage.toNumber}
                          onChange={(e) =>
                            setNewMessage({
                              ...newMessage,
                              toNumber: e.target.value,
                            })
                          }
                          placeholder="+1234567890"
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-green-500 focus:border-green-500"
                          required
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Include country code (e.g., +1 for US)
                        </p>
                        <p className="mt-1 text-xs text-yellow-600">
                          💡 Tip: Recipients must message you first, or you can only message them within 24 hours of their last message
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Message
                        </label>
                        <textarea
                          value={newMessage.messageBody}
                          onChange={(e) =>
                            setNewMessage({
                              ...newMessage,
                              messageBody: e.target.value,
                            })
                          }
                          rows={4}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-green-500 focus:border-green-500"
                          placeholder="Type your message here..."
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                      type="submit"
                      disabled={sendMessage.isPending}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                    >
                      {sendMessage.isPending ? "Sending..." : "Send Message"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSendForm(false)}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
