export class User {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
    role?: string;
    createdAt?: Date;
    updatedAt?: Date;
  
    constructor(data?: Partial<User>) {
      this.id = data?.id ?? '';
      this.firstName = data?.firstName ?? '';
      this.lastName = data?.lastName ?? '';
      this.email = data?.email ?? '';
      this.phoneNumber = data?.phoneNumber ?? '';
      this.role = data?.role ?? 'user';
      this.createdAt = data?.createdAt ?? new Date();
      this.updatedAt = data?.updatedAt ?? new Date();
    }
  }
  