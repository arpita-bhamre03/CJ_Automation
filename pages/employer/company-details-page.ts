/**
 * Employer sign-up, stage 2/3 - Company Details ("Tell us more about your
 * company and role"). Reached straight after the password is set, with the new
 * user signed in.
 *
 * Hooks, read off the deployed bundle:
 *   fields     auth-company-details-<field>-input
 *   industry   auth-company-details-industry-type-select - a searchable menu with
 *              ...-search and one ...-option-<value> per industry
 *   uploads    auth-company-details-{company-logo,profile-photo}-upload is the
 *              visible box; ...-upload-input is the hidden file input
 *
 * Behaviour worth knowing:
 *  - Every field is optional to the app's validation; the sign-up test fills all.
 *  - A 6-digit pincode is looked up and auto-fills city, taluka and district.
 *  - The LinkedIn field rewrites its value on every keystroke (it prefixes
 *    https://www.linkedin.com/), so typing it character by character garbles it.
 *    It and the website field are set in one go.
 *  - Logo and photo upload as soon as a file is chosen (JPG/JPEG/PNG/WEBP, 5 MB);
 *    the box then shows the file name.
 *
 * Layer rules: locators + actions + queries only. No assertions, no test data.
 */
import * as path from 'path';
import { Locator, Page } from '@playwright/test';
import { BasePage } from '@core/base/base-page';
import { logger } from '@helpers/logger';

/** The free-text fields on the Company Details form. */
export interface CompanyDetails {
  designation: string;
  linkedInUrl: string;
  companyWebsite: string;
  pincode: string;
  addressLine1: string;
  description: string;
}

const INDUSTRY_SELECT = 'auth-company-details-industry-type-select';

export class EmployerCompanyDetailsPage extends BasePage {
  // ===== LOCATORS =====
  readonly screen: Locator;
  readonly screenTitle: Locator;
  readonly stepBadge: Locator;
  readonly designationInput: Locator;
  readonly linkedInUrlInput: Locator;
  readonly companyWebsiteInput: Locator;
  readonly industrySelect: Locator;
  readonly industrySearch: Locator;
  readonly industryOptions: Locator;
  readonly pincodeInput: Locator;
  readonly cityInput: Locator;
  readonly talukaInput: Locator;
  readonly districtInput: Locator;
  readonly addressLine1Input: Locator;
  readonly descriptionInput: Locator;
  readonly logoUploadBox: Locator;
  readonly logoFileInput: Locator;
  readonly profilePhotoUploadBox: Locator;
  readonly profilePhotoFileInput: Locator;
  readonly continueButton: Locator;

  static readonly URL = /\/auth\/company-details-verification\b/;

  constructor(page: Page) {
    super(page);

    this.screen = page.getByTestId('auth-company-details-page');
    this.screenTitle = page.getByTestId('auth-company-details-title');
    this.stepBadge = page.getByTestId('auth-company-details-step-badge');

    this.designationInput = this.textFieldByTestId('auth-company-details-designation-input');
    this.linkedInUrlInput = this.textFieldByTestId('auth-company-details-linkedin-url-input');
    this.companyWebsiteInput = this.textFieldByTestId('auth-company-details-company-url-input');

    // The hook sits on MUI's hidden native <input>; the visible dropdown is the
    // role="combobox" sibling, which intercepts clicks aimed at the hidden input.
    this.industrySelect = page.getByTestId(INDUSTRY_SELECT).locator('..').getByRole('combobox');
    this.industrySearch = this.textFieldByTestId(`${INDUSTRY_SELECT}-search`);
    this.industryOptions = page.locator(`[data-testid^="${INDUSTRY_SELECT}-option-"]`);

    this.pincodeInput = this.textFieldByTestId('auth-company-details-pincode-input');
    this.cityInput = this.textFieldByTestId('auth-company-details-city-input');
    this.talukaInput = this.textFieldByTestId('auth-company-details-taluka-input');
    this.districtInput = this.textFieldByTestId('auth-company-details-district-input');
    this.addressLine1Input = this.textFieldByTestId('auth-company-details-address-line1-input');
    this.descriptionInput = this.textFieldByTestId(
      'auth-company-details-company-description-input',
    );

    this.logoUploadBox = page.getByTestId('auth-company-details-company-logo-upload');
    this.logoFileInput = page.getByTestId('auth-company-details-company-logo-upload-input');
    this.profilePhotoUploadBox = page.getByTestId('auth-company-details-profile-photo-upload');
    this.profilePhotoFileInput = page.getByTestId(
      'auth-company-details-profile-photo-upload-input',
    );

    this.continueButton = page.getByTestId('auth-company-details-submit-button');
  }

  // ===== NAVIGATION =====
  async waitForScreen(): Promise<void> {
    await this.waitForUrl(EmployerCompanyDetailsPage.URL);
    await this.waitForVisible(this.screen);
  }

  // ===== ACTIONS =====
  async fillRoleAndLinks(details: CompanyDetails): Promise<void> {
    await this.fill(this.designationInput, details.designation);
    // Both URL fields rewrite their value per keystroke - set them in one go.
    await this.fillWithoutTyping(this.linkedInUrlInput, details.linkedInUrl);
    await this.fillWithoutTyping(this.companyWebsiteInput, details.companyWebsite);
  }

  /**
   * Open the industry menu and choose the first real industry - the list comes
   * from the server, so no particular value is assumed. It is typed into the
   * menu's search box first, the way a person would find it. Returns its label.
   */
  async selectIndustry(): Promise<string> {
    await this.click(this.industrySelect);
    const firstIndustry = this.industryOptions.filter({ hasNotText: /^\s*Other\s*$/ }).first();
    await this.waitForVisible(firstIndustry);
    const label = ((await firstIndustry.textContent()) ?? '').trim();

    if (await this.isVisible(this.industrySearch, 2_000)) {
      await this.fill(this.industrySearch, label);
    }
    await this.click(this.industryOptions.filter({ hasText: label }).first());
    logger.info(`Selected industry: ${label}`);
    return label;
  }

  async enterPincode(pincode: string): Promise<void> {
    await this.fill(this.pincodeInput, pincode);
  }

  /** Wait for the pincode lookup to fill in the city. */
  async waitForAddressAutofill(timeoutMs = 20_000): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if ((await this.cityInput.inputValue()).trim()) return;
      await this.page.waitForTimeout(250);
    }
    throw new Error(`City was not auto-filled from the pincode within ${timeoutMs / 1000}s.`);
  }

  async fillAddressAndDescription(details: CompanyDetails): Promise<void> {
    await this.fill(this.addressLine1Input, details.addressLine1);
    await this.fill(this.descriptionInput, details.description);
  }

  async uploadCompanyLogo(filePath: string): Promise<void> {
    await this.uploadAndWaitForFileName(this.logoFileInput, this.logoUploadBox, filePath);
  }

  async uploadProfilePhoto(filePath: string): Promise<void> {
    await this.uploadAndWaitForFileName(
      this.profilePhotoFileInput,
      this.profilePhotoUploadBox,
      filePath,
    );
  }

  async clickContinue(): Promise<void> {
    await this.waitForEnabled(this.continueButton);
    await this.click(this.continueButton);
  }

  /** The box shows the file name once the upload has finished. */
  private async uploadAndWaitForFileName(
    fileInput: Locator,
    uploadBox: Locator,
    filePath: string,
  ): Promise<void> {
    const fileName = path.basename(filePath);
    logger.info(`Uploading ${fileName}`);
    await this.uploadFile(fileInput, filePath);
    await this.waitForVisible(uploadBox.filter({ hasText: fileName }), 30_000);
  }

  // ===== QUERIES =====
  async isScreenDisplayed(): Promise<boolean> {
    return this.isVisible(this.screen);
  }

  async getScreenTitle(): Promise<string> {
    return (await this.getText(this.screenTitle)).trim();
  }

  async getStepBadge(): Promise<string> {
    return (await this.getText(this.stepBadge)).trim();
  }

  async getSelectedIndustry(): Promise<string> {
    return (await this.getText(this.industrySelect)).trim();
  }

  async getCity(): Promise<string> {
    return (await this.cityInput.inputValue()).trim();
  }

  async getDistrict(): Promise<string> {
    return (await this.districtInput.inputValue()).trim();
  }

  async getLogoUploadText(): Promise<string> {
    return this.getText(this.logoUploadBox);
  }

  async getProfilePhotoUploadText(): Promise<string> {
    return this.getText(this.profilePhotoUploadBox);
  }
}
