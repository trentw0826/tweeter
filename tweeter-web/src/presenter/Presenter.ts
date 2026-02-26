export interface View {
  displayErrorMessage(message: string): void;
}

export interface MessageView extends View {
  displayInfoMessage(
    message: string,
    duration: number,
    bootstrapClasses?: string,
  ): string;
  deleteMessage(messageId: string): void;
}

export abstract class Presenter<V extends View> {
  private _view: V;

  protected constructor(view: V) {
    this._view = view;
  }

  protected get view(): V {
    return this._view;
  }

  protected async doFailureReportingOperation(
    operationDescription: string,
    operation: () => Promise<void>,
  ) {
    try {
      await operation();
    } catch (error) {
      this._view.displayErrorMessage(
        `Failed operation "${operationDescription}" because of exception: ${error}`,
      );
    }
  }

  protected async doLoadingOperation(
    view: { setIsLoading: (value: boolean) => void },
    operationDescription: string,
    operation: () => Promise<void>,
  ): Promise<void> {
    view.setIsLoading(true);
    await this.doFailureReportingOperation(operationDescription, operation);
    view.setIsLoading(false);
  }

  protected async doLoadingOperationWithToast(
    view: { setIsLoading: (value: boolean) => void } & MessageView,
    toastMessage: string,
    operationDescription: string,
    operation: () => Promise<void>,
  ): Promise<void> {
    view.setIsLoading(true);
    const toastId = view.displayInfoMessage(toastMessage, 0);
    await this.doFailureReportingOperation(operationDescription, operation);
    view.deleteMessage(toastId);
    view.setIsLoading(false);
  }
}
