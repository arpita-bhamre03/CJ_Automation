/**
 * Builder for employer sign-up data, covering all three stages.
 *
 * Every value that must be unique is generated per call: the portal rejects a
 * mobile number or email that is already registered. Values follow the app's own
 * validation rules - full name letters and spaces only; Indian mobile starting
 * 6-9, not sequential or all one digit; password with upper, lower, digit and
 * special character; LinkedIn URL of the form linkedin.com/company/...; website a
 * bare domain; description letters, digits and basic punctuation.
 *
 * Both emails are Yopmail addresses sharing one suffix, so the official (admin)
 * inbox is brand new and holds only this sign-up's code. Upload files are small
 * QA samples in testdata/signup/assets/, each labelled as not a real record.
 */
import * as path from 'path';
import { TESTDATA_DIR } from '@config/app.config';
import type { EmployerRegistrationDetails } from '@pages/employer/signup-page';
import type { CompanyDetails } from '@pages/employer/company-details-page';
import type { CompanyDocumentFiles } from '@pages/employer/company-documents-page';
import {
  companyName,
  fullName,
  password,
  phoneNumber,
  uniqueSuffix,
} from '@utilities/data-generator';

const ASSETS = path.join(TESTDATA_DIR, 'signup', 'assets');

export interface EmployerSignUpData {
  /** Stage 1/3 - registration form. */
  details: EmployerRegistrationDetails;
  password: string;
  /** Stage 2/3 - company details form and its two image uploads. */
  companyDetails: CompanyDetails;
  images: { companyLogo: string; profilePhoto: string };
  /** Stage 3/3 - company documents. */
  documents: CompanyDocumentFiles;
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
    companyDetails: {
      designation: 'HR Manager',
      linkedInUrl: `https://www.linkedin.com/company/qa-test-${suffix}`,
      companyWebsite: `www.qatest${suffix}.com`,
      // Pune - a real pincode, so the address lookup has something to return.
      pincode: '411001',
      addressLine1: 'QA Tower, 12 Test Street',
      description: 'QA automation test company created by the CentraJob employer sign-up test.',
    },
    images: {
      companyLogo: path.join(ASSETS, 'company-logo.png'),
      profilePhoto: path.join(ASSETS, 'profile-photo.png'),
    },
    documents: {
      'company-registration': path.join(ASSETS, 'company-registration.pdf'),
      'tax-registration': path.join(ASSETS, 'tax-registration.pdf'),
      'address-proof': path.join(ASSETS, 'address-proof.pdf'),
    },
  };
};
