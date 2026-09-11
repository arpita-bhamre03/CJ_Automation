/**
 * Builder for employer sign-up data.
 *
 * Every value is generated and unique per call: the portal rejects a mobile
 * number or email that is already registered. Values follow the app's own
 * validation rules - full name letters and spaces only; Indian mobile starting
 * 6-9, not sequential or all one digit; password with upper, lower, digit and
 * special character. Both emails are Yopmail addresses sharing one suffix, so
 * the official (admin) inbox is brand new and holds only this sign-up's code.
 */
import type { EmployerRegistrationDetails } from '@pages/employer/signup-page';
import {
  companyName,
  fullName,
  password,
  phoneNumber,
  uniqueSuffix,
} from '@utilities/data-generator';

export interface EmployerSignUpData {
  details: EmployerRegistrationDetails;
  password: string;
}

export const newEmployerRegistration = (): EmployerSignUpData => {
  const suffix = uniqueSuffix();
  return {
    details: {
      fullName: fullName(),
      companyName: companyName(),
      mobileNumber: phoneNumber(),
      companyEmail: `qa.org.${suffix}@yopmail.com`,
      adminEmail: `qa.admin.${suffix}@yopmail.com`,
    },
    password: password(),
  };
};
