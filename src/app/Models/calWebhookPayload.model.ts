export interface CalBookingEvent {
    uid: string;
    user: string;
  
    attendeeName: string;
    attendeeStartTime: string;
    name: string;
  
    email: string[];
    phone: string[];
  
    description: string;
    title: string[];
  
    location: string;
  
    eventTypeSlug: string;
    type: string;
  
    hostName: string;
    hostStartTime: string;
  
    startTime: string;
    endTime: string;
  
    isEmbed: string;
    isSuccessBookingPage: string;

    slot: string;
    
    // RESCHEDULE
    formerTime?: string
    rescheduleUid?: string
    rescheduledBy?: string[]

    // EXTRA
    bookingID: string;
    status: 'ADD' | 'RESCHEDULE' | 'DELETED'

  }