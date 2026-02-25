import { AuthPresenter, AuthView } from "./AuthPresenter";
import { Buffer } from "buffer";

export interface ImageFileProcessingResult {
  imageUrl: string;
  imageBytes: Uint8Array;
  imageFileExtension: string;
}

export class RegisterPresenter extends AuthPresenter {
  public constructor(view: AuthView) {
    super(view);
  }

  public async processImageFile(
    file: File | undefined,
  ): Promise<ImageFileProcessingResult | null> {
    if (!file) {
      return null;
    }

    const imageUrl = URL.createObjectURL(file);
    const imageBytes = await this.readFileAsBytes(file);
    const imageFileExtension = this.getFileExtension(file);

    if (!imageFileExtension) {
      return null;
    }

    return {
      imageUrl,
      imageBytes,
      imageFileExtension,
    };
  }

  public isRegisterFormValid(
    firstName: string,
    lastName: string,
    alias: string,
    password: string,
    imageUrl: string,
    imageFileExtension: string,
  ): boolean {
    return (
      !!firstName &&
      !!lastName &&
      !!alias &&
      !!password &&
      !!imageUrl &&
      !!imageFileExtension
    );
  }

  private getFileExtension(file: File): string | undefined {
    return file.name.split(".").pop();
  }

  private async readFileAsBytes(file: File): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event: ProgressEvent<FileReader>) => {
        try {
          const imageStringBase64 = event.target?.result as string;
          const imageStringBase64BufferContents =
            imageStringBase64.split("base64,")[1];
          const bytes: Uint8Array = Buffer.from(
            imageStringBase64BufferContents,
            "base64",
          );
          resolve(bytes);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  }

  public async register(
    firstName: string,
    lastName: string,
    alias: string,
    password: string,
    userImageBytes: Uint8Array,
    imageFileExtension: string,
    rememberMe: boolean,
  ): Promise<void> {
    this.view.setIsLoading(true);

    await this.doFailureReportingOperation("register user", async () => {
      const [user, authToken] = await this.authService.register(
        firstName,
        lastName,
        alias,
        password,
        userImageBytes,
        imageFileExtension,
      );

      this.view.updateUserInfo(user, authToken, rememberMe);
      this.view.navigateTo(`/feed/${user.alias}`);
    });

    this.view.setIsLoading(false);
  }
}
