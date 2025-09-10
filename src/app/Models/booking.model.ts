export class Booking {
    userID: string;
    bookingID: string;
    user: string;
    attendeeName: string;
    attendeeEmail: string;
    attendeePhone: string; 
    attendeeStartTime: string;
    name: string;
    email: string;
    phone: string;
    description: string;
    title: string;
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
    formerTime: string;
    rescheduleUid: string;
    rescheduledBy: string;
    status: 'ADD' | 'RESCHEDULE' | 'DELETED';
    price: number
  
    constructor(data?: Partial<Booking>) {
      this.userID = data?.userID ?? '';
      this.bookingID = data?.bookingID ?? '';
      this.user = data?.user ?? '';
      this.attendeeName = data?.attendeeName ?? '';
      this.attendeeEmail = data?.attendeeEmail ?? ''
      this.attendeePhone = data?.attendeePhone ?? ''
      this.attendeeStartTime = data?.attendeeStartTime ?? '';
      this.name = data?.name ?? '';
      this.email = data?.email ?? '';
      this.phone = data?.phone ?? '';
      this.description = data?.description ?? '';
      this.title = data?.title ?? '';
      this.location = data?.location ?? '';
      this.eventTypeSlug = data?.eventTypeSlug ?? '';
      this.type = data?.type ?? '';
      this.hostName = data?.hostName ?? '';
      this.hostStartTime = data?.hostStartTime ?? '';
      this.startTime = data?.startTime ?? '';
      this.endTime = data?.endTime ?? '';
      this.isEmbed = data?.isEmbed ?? '';
      this.isSuccessBookingPage = data?.isSuccessBookingPage ?? '';
      this.slot = data?.slot ?? '';
      this.formerTime = data?.formerTime ?? '';
      this.rescheduleUid = data?.rescheduleUid ?? '';
      this.rescheduledBy = data?.rescheduledBy ?? '';
      this.status = data?.status ?? 'ADD';
      this.price = data?.price ?? 0
    }
  }