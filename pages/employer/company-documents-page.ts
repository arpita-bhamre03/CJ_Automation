/**
 * Employer sign-up, stage 3/3 - company documents ("Verify Your Business and
 * Gain Credibility").
 *
 * Three uploads - company registration, tax registration and address proof -
 * each sent to the server the moment a file is chosen (SVG/PNG/JPG/JPEG/GIF/PDF/
 * WEBP, 16 MB); the box then shows the file name. "Finish Sign-up" submits the
 * company for verification and opens the new employer's dashboard. (The older
 * local source logged the user out to the login page; the live app does not.)
 *
 * Hooks, read off the deployed bundle: auth-company-documents-<document>-upload
 * is the visible box, ...-upload-input the hidden file input.
 *
 * Layer rules: locators + actions + queries only. No assertions, no test data.
 */
import * as path from 'path';
import { Locator, Page } from '@playwright/test';
import { BasePage } from '@core/base/base-page';
import { logger } from '@helpers/logger';

export type CompanyDocument = 'company-registration' | 'tax-registration' | 'address-proof';

/** A file path for each of the three documents. */
export type CompanyDocumentFiles = Record<CompanyDocument, string>;

const DOCUMENTS: CompanyDocument[] = ['company-registration', 'tax-registration', 'address-proof'];

export class EmployerCompanyDocumentsPage extends BasePage {
  // ===== LOCATORS =====
  readonly screen: Locator;
  readonly screenTitle: Locator;
  readonly stepBadge: Locator;
  readonly finishSignUpButton: Locator;

  static readonly URL = /\/auth\/company-documents-verification\b/;

  constructor(page: Page) {
    super(page);
    this.screen = page.getByTestId('auth-company-documents-page');
    this.screenTitle = page.getByTestId('auth-company-documents-title');
    this.stepBadge = page.getByTestId('auth-company-documents-step-badge');
    this.finishSignUpButton = page.getByTestId('auth-company-documents-submit-button');
  }

  private uploadBox(document: CompanyDocument): Locator {
    return this.page.getByTestId(`auth-company-documents-${document}-upload`);
  }

  private fileInput(document: CompanyDocument): Locator {
    return this.page.getByTestId(`auth-company-documents-${document}-upload-input`);
  }

  // ===== NAVIGATION =====
  async waitForScreen(): Promise<void> {
    await this.waitForUrl(EmployerCompanyDocumentsPage.URL);
    await this.waitForVisible(this.screen);
  }

  // ===== ACTIONS =====
  async uploadDocument(document: CompanyDocument, filePath: string): Promise<void> {
    const fileName = path.basename(filePath);
    logger.info(`Uploading ${document}: ${fileName}`);
    await this.uploadFile(this.fileInput(document), filePath);
    // The box shows the file name only after the server has accepted the upload.
    await this.waitForVisible(this.uploadBox(document).filter({ hasText: fileName }), 30_000);
  }

  async uploadAllDocuments(files: CompanyDocumentFiles): Promise<void> {
    for (const document of DOCUMENTS) {
      await this.uploadDocument(document, files[document]);
    }
  }

  async clickFinishSignUp(): Promise<void> {
    await this.waitForEnabled(this.finishSignUpButton);
    await this.click(this.finishSignUpButton);
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

  async getDocumentUploadText(document: CompanyDocument): Promise<string> {
    return this.getText(this.uploadBox(document));
  }
}
