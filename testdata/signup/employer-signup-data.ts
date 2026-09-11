/**
 * Builder for employer sign-up data, covering all three stages.
 *
 * Values read like a real person and company - e.g. Diya Patel of Nexora
 * Solutions, diya.patel4821@yopmail.com - so a watched run looks natural. A
 * 4-digit number is shared across both emails: the portal rejects a mobile
 * number or email that is already registered, so it keeps every run unique, and
 * it makes the official (admin) inbox brand new, holding only this sign-up's code.
 *
 * Values follow the app's own validation rules - full name letters and spaces
 * only; Indian mobile starting 6-9, not sequential or all one digit; password
 * with upper, lower, digit and special character, 8+ long; LinkedIn URL of the
 * form linkedin.com/company/...; website a bare domain; description letters,
 * digits and basic punctuation. The description is where the account is marked
 * as QA test data, since everything else looks real.
 *
 * Upload files are small QA samples in testdata/signup/assets/, each labelled as
 * not a real record.
 */
import * as path from 'path';
import { TESTDATA_DIR } from '@config/app.config';
import type { EmployerRegistrationDetails } from '@pages/employer/signup-page';
import type { CompanyDetails } from '@pages/employer/company-details-page';
import type { CompanyDocumentFiles } from '@pages/employer/company-documents-page';
import { businessName, person, phoneNumber, shortNumber } from '@utilities/data-generator';

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
  const contact = person(); // e.g. Diya Patel
  const company = businessName(); // e.g. Nexora Solutions
  const id = shortNumber(4); // e.g. 4821 - keeps both emails unique per run

  const first = contact.firstName.toLowerCase();
  const last = contact.lastName.toLowerCase();
  const companyWord = company.split(' ')[0].toLowerCase(); // nexora
  const companySlug = company.toLowerCase().replace(/\s+/g, '-'); // nexora-solutions

  return {
    details: {
      fullName: contact.fullName,
      companyName: company,
      mobileNumber: phoneNumber(),
      companyEmail: `hr.${companyWord}${id}@yopmail.com`, // hr.nexora4821@yopmail.com
      adminEmail: `${first}.${last}${id}@yopmail.com`, // diya.patel4821@yopmail.com
    },
    // Readable when shown on screen (e.g. Diya@4821) and meets the password rules.
    password: `${contact.firstName}@${id}`,
    companyDetails: {
      designation: 'HR Manager',
      linkedInUrl: `https://www.linkedin.com/company/${companySlug}`,
      companyWebsite: `www.${companySlug.replace(/-/g, '')}.com`,
      // Pune - a real pincode, so the address lookup has something to return.
      pincode: '411001',
      addressLine1: '12 MG Road, Camp',
      description: `${company} builds software for growing businesses. (Created by CentraJob QA automation.)`,
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
