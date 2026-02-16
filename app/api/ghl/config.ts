export const GHL_CONFIG = {
  // The Pipeline ID for "TradeFlow Board"
  pipelineId: "QkJLrUuIgVg7P8zkpzv0",

  // Map Internal Stages -> GHL Stage IDs
  stageIds: {
    'new-lead': "088133fe-d9ee-450a-8d99-ab5c4f5f369c",
    'quote-sent': "16469d28-797d-4d1b-9346-1da5132d1fce",
    'job-booked': "f04dec72-f9cd-4123-ae3c-6ad7d167cf60",
    'job-complete': "fa8410ea-29bf-4132-bff5-7fdbed7b56ca",
    'previous-jobs': "3913c899-24ee-47a3-9829-5e3311a90167",
  },

  // Map Internal Fields -> GHL Custom Field IDs (OPPORTUNITY OBJECT)
  customFields: {
    // --- SNAPSHOT FIELDS (Identity) ---
    jobFirstName: "XuRyTrUlQNLMXjAH9FSc",
    jobLastName: "vw1H3jxkl3NotaFAbFk4",
    jobEmail: "FD6pHxvzzpr21U6N7CvT",
    jobPhone: "pRRDz4eICPT1Au239aOb",

    // --- JOB FIELDS (Data) ---
    jobType: "aNhLmUCVamAc3uvtk7YQ",
    
    // --- NEW DUAL PAYMENT STATUS ---
    // ⚠️ ACTION REQUIRED: Replace these with your REAL GHL Field IDs
    depositStatus: "DIMOMD5ZEL3aCMCOdLF5", 
    invoiceStatus: "8WGwtHQC7lyBnz8Jq5OI", 
    
    // REMOVED: paymentStatus (Old single field)

    reviewStatus: "bfhMYTkqEMwfhMQVVDoY",  
    reviewRating: "Lcu90EH8rmu44upP35Bl",  
    reviewChannel: "dV6DDkL0c3uiWY3AZTHW",
    reviewSource: "izfap0oVJ9VHJA8zurJd",
    
    // --- DATES ---
    jobStart: "QAqB67Vhhku0sr6lYKRl",      
    jobEnd: "cBs3OZODdrbc3jVNvvTQ",        
    reviewSchedule: "32bSSFxQ1XvY6nAGFIcb"
  },

  // Tags we look for
  tags: {
    recaptured: "recaptured-lead"
  }
};