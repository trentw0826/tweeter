export interface View {
  displayErrorMessage(message: string): void;
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
        `Failed operation \"${operationDescription}\" because of exception: ${error}`,
      );
    }
  }
}
