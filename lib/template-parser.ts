import { CommunicationConfig, DEFAULT_COMMUNICATION_CONFIG } from './default-templates';

/**
 * Parses a template string and injects variables.
 */
export function parseTemplate(template: string, variables: Record<string, any>): string {
  if (!template) return "";

  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = variables[key];
    
    if (value !== undefined && value !== null) {
      return String(value);
    }
    
    if (key === 'firstName') return 'Customer';
    if (key === 'myCompany') return 'TradeFlow';
    
    return "";
  });
}

/**
 * Helper to merge User Config with Defaults.
 */
export function getMergedConfig(userConfig: any): CommunicationConfig {
  if (!userConfig) return DEFAULT_COMMUNICATION_CONFIG;

  return {
    quote: { ...DEFAULT_COMMUNICATION_CONFIG.quote, ...(userConfig.quote || {}) },
    invoice: { ...DEFAULT_COMMUNICATION_CONFIG.invoice, ...(userConfig.invoice || {}) },
    booking: { ...DEFAULT_COMMUNICATION_CONFIG.booking, ...(userConfig.booking || {}) },
    review: { ...DEFAULT_COMMUNICATION_CONFIG.review, ...(userConfig.review || {}) },
    // FIX: Merge Subcontractor Config
    subcontractor: { ...DEFAULT_COMMUNICATION_CONFIG.subcontractor, ...(userConfig.subcontractor || {}) },
  };
}