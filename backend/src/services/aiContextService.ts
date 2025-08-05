import { IContact, IContactInteraction } from '../models/Contact';

export interface AIContextSummary {
  contactProfile: string;
  preferences: string[];
  interests: string[];
  painPoints: string[];
  conversationHistory: string;
  recommendations: string[];
  nextActions: string[];
}

export class AIContextService {
  /**
   * Generate a comprehensive context summary for AI conversations
   */
  static generateContextSummary(contact: IContact): AIContextSummary {
    const profile = this.generateContactProfile(contact);
    const conversationHistory = this.generateConversationHistory(contact.interactions);
    const recommendations = this.generateRecommendations(contact);
    const nextActions = this.generateNextActions(contact);

    return {
      contactProfile: profile,
      preferences: contact.aiContext.preferences,
      interests: contact.aiContext.interests,
      painPoints: contact.aiContext.painPoints,
      conversationHistory,
      recommendations,
      nextActions,
    };
  }

  /**
   * Generate a natural language profile of the contact
   */
  private static generateContactProfile(contact: IContact): string {
    const parts = [];
    
    parts.push(`${contact.firstName} ${contact.lastName}`);
    
    if (contact.jobTitle && contact.company) {
      parts.push(`works as ${contact.jobTitle} at ${contact.company}`);
    } else if (contact.jobTitle) {
      parts.push(`works as ${contact.jobTitle}`);
    } else if (contact.company) {
      parts.push(`works at ${contact.company}`);
    }

    parts.push(`is a ${contact.type.toLowerCase()} in ${contact.contextState.toLowerCase()} status`);
    
    if (contact.priority !== 'medium') {
      parts.push(`with ${contact.priority} priority`);
    }

    if (contact.leadSource) {
      parts.push(`discovered through ${contact.leadSource}`);
    }

    if (contact.aiContext.budget && (contact.aiContext.budget.min || contact.aiContext.budget.max)) {
      const budgetStr = contact.aiContext.budget.min && contact.aiContext.budget.max
        ? `$${contact.aiContext.budget.min}-${contact.aiContext.budget.max}`
        : contact.aiContext.budget.min
        ? `$${contact.aiContext.budget.min}+`
        : `up to $${contact.aiContext.budget.max}`;
      parts.push(`has a budget of ${budgetStr} ${contact.aiContext.budget.currency}`);
    }

    return parts.join(', ') + '.';
  }

  /**
   * Generate a summary of recent conversation history
   */
  private static generateConversationHistory(interactions: IContactInteraction[]): string {
    if (interactions.length === 0) {
      return 'No previous interactions recorded.';
    }

    const recentInteractions = interactions
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    const summary = recentInteractions.map(interaction => {
      const date = new Date(interaction.createdAt).toLocaleDateString();
      const type = interaction.type.charAt(0).toUpperCase() + interaction.type.slice(1);
      const subject = interaction.subject ? ` - ${interaction.subject}` : '';
      const preview = interaction.content.length > 100 
        ? interaction.content.substring(0, 100) + '...'
        : interaction.content;
      
      return `${date}: ${type}${subject} - ${preview}`;
    }).join('\n');

    return `Recent interactions:\n${summary}`;
  }

  /**
   * Generate personalized recommendations based on contact data
   */
  private static generateRecommendations(contact: IContact): string[] {
    const recommendations: string[] = [];

    // Based on context state
    switch (contact.contextState) {
      case 'New':
        recommendations.push('Schedule an initial consultation call');
        recommendations.push('Send welcome package with company information');
        break;
      case 'Touring':
        recommendations.push('Follow up on tour experience and questions');
        recommendations.push('Provide pricing and membership options');
        break;
      case 'Negotiating':
        recommendations.push('Address any remaining concerns or objections');
        recommendations.push('Prepare customized proposal or contract');
        break;
      case 'Active':
        recommendations.push('Check satisfaction and gather feedback');
        recommendations.push('Identify upselling or expansion opportunities');
        break;
      case 'Inactive':
        recommendations.push('Reach out to understand reasons for inactivity');
        recommendations.push('Offer re-engagement incentives or solutions');
        break;
      case 'Churned':
        recommendations.push('Conduct exit interview to understand reasons');
        recommendations.push('Keep in touch for potential future re-engagement');
        break;
    }

    // Based on preferences and interests
    if (contact.aiContext.preferences.length > 0) {
      recommendations.push(`Tailor solutions to their preferences: ${contact.aiContext.preferences.join(', ')}`);
    }

    if (contact.aiContext.interests.length > 0) {
      recommendations.push(`Leverage their interests: ${contact.aiContext.interests.join(', ')}`);
    }

    // Based on pain points
    if (contact.aiContext.painPoints.length > 0) {
      recommendations.push(`Address their pain points: ${contact.aiContext.painPoints.join(', ')}`);
    }

    // Based on priority
    if (contact.priority === 'high') {
      recommendations.push('Prioritize immediate response and personalized attention');
    }

    return recommendations;
  }

  /**
   * Generate suggested next actions
   */
  private static generateNextActions(contact: IContact): string[] {
    const actions: string[] = [];
    const daysSinceLastUpdate = Math.floor(
      (Date.now() - new Date(contact.aiContext.lastContextUpdate).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Time-based actions
    if (daysSinceLastUpdate > 7) {
      actions.push('Schedule check-in call or meeting');
    }

    if (daysSinceLastUpdate > 30) {
      actions.push('Update contact information and preferences');
    }

    // Context state based actions
    switch (contact.contextState) {
      case 'New':
        actions.push('Send initial outreach email');
        actions.push('Schedule discovery call');
        break;
      case 'Touring':
        actions.push('Send tour follow-up email');
        actions.push('Provide additional information requested');
        break;
      case 'Negotiating':
        actions.push('Send proposal or quote');
        actions.push('Schedule decision-making meeting');
        break;
      case 'Active':
        actions.push('Schedule regular check-in');
        actions.push('Gather feedback and testimonial');
        break;
      case 'Inactive':
        actions.push('Send re-engagement email');
        actions.push('Offer special promotion or incentive');
        break;
    }

    // Priority-based actions
    if (contact.priority === 'high') {
      actions.unshift('Follow up within 24 hours');
    }

    return actions;
  }

  /**
   * Extract key insights from interaction content using simple keyword analysis
   */
  static extractInsights(interaction: IContactInteraction): {
    mentions: string[];
    sentiment: 'positive' | 'neutral' | 'negative';
    topics: string[];
  } {
    const content = interaction.content.toLowerCase();
    
    // Simple keyword extraction
    const mentions: string[] = [];
    const topics: string[] = [];
    
    // Look for mentions of common coworking topics
    const coworkingTopics = [
      'office space', 'hot desk', 'private office', 'meeting room',
      'pricing', 'membership', 'contract', 'wifi', 'parking',
      'amenities', 'community', 'networking', 'location'
    ];
    
    coworkingTopics.forEach(topic => {
      if (content.includes(topic)) {
        topics.push(topic);
      }
    });

    // Simple sentiment analysis based on keywords
    const positiveWords = ['great', 'excellent', 'love', 'perfect', 'amazing', 'wonderful', 'satisfied'];
    const negativeWords = ['bad', 'terrible', 'hate', 'awful', 'disappointed', 'unsatisfied', 'problem'];
    
    const positiveCount = positiveWords.filter(word => content.includes(word)).length;
    const negativeCount = negativeWords.filter(word => content.includes(word)).length;
    
    let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
    if (positiveCount > negativeCount) {
      sentiment = 'positive';
    } else if (negativeCount > positiveCount) {
      sentiment = 'negative';
    }

    return {
      mentions,
      sentiment,
      topics,
    };
  }

  /**
   * Generate conversation prompts for different interaction types
   */
  static generateConversationPrompts(contact: IContact, interactionType: string): string[] {
    const prompts: string[] = [];
    const name = contact.firstName;

    switch (interactionType) {
      case 'call':
        prompts.push(`Hi ${name}, I hope you're doing well. I wanted to check in and see how you're finding our space.`);
        prompts.push(`${name}, thank you for your interest in our coworking space. I'd love to discuss how we can support your business needs.`);
        break;
      
      case 'email':
        prompts.push(`Subject: Following up on your interest in our coworking space\n\nHi ${name},\n\nI hope this email finds you well...`);
        prompts.push(`Subject: Your tour at [Space Name]\n\nHi ${name},\n\nThank you for taking the time to tour our facility yesterday...`);
        break;
      
      case 'meeting':
        prompts.push(`Meeting agenda: Introduction and needs assessment with ${name}`);
        prompts.push(`Meeting goals: Present membership options and address ${name}'s specific requirements`);
        break;
      
      case 'tour':
        prompts.push(`Tour highlights to mention: [Key amenities based on ${name}'s interests]`);
        prompts.push(`Questions to ask during tour: What does ${name} like most about the space?`);
        break;
    }

    // Add context-specific prompts
    if (contact.aiContext.painPoints.length > 0) {
      prompts.push(`Address their pain points: ${contact.aiContext.painPoints.join(', ')}`);
    }

    if (contact.aiContext.interests.length > 0) {
      prompts.push(`Highlight features that align with their interests: ${contact.aiContext.interests.join(', ')}`);
    }

    return prompts;
  }
}

export default AIContextService;