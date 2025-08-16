import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiService } from "../services/api";
import { SendWhatsAppMessageRequest } from "@shared/types";


// Get WhatsApp status
export const useWhatsAppStatus = () => {
  return useQuery({
    queryKey: ["whatsapp", "status"],
    queryFn: async () => {
      const response = await apiService.getWhatsAppStatus();
      return response.data;
    },
  });
};

// Send WhatsApp message
export const useSendWhatsAppMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SendWhatsAppMessageRequest) => {
      const response = await apiService.sendWhatsAppMessage(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp"] });
    },
  });
};

// Get conversations
export const useWhatsAppConversations = () => {
  return useQuery({
    queryKey: ["whatsapp", "conversations"],
    queryFn: async () => {
      const response = await apiService.getWhatsAppConversations();
      return response.data;
    },
  });
};

// Get specific conversation
export const useWhatsAppConversation = (phoneNumber: string) => {
  return useQuery({
    queryKey: ["whatsapp", "conversation", phoneNumber],
    queryFn: async () => {
      const response = await apiService.getWhatsAppConversation(phoneNumber);
      return response.data;
    },
    enabled: !!phoneNumber,
  });
};
