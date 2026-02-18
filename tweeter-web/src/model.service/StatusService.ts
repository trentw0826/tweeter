import { AuthToken, Status } from "tweeter-shared";
import { FakeData } from "tweeter-shared/dist/util/FakeData";

export class StatusService {
	public async retrievePageOfFeedItems(
		authToken: AuthToken,
		userAlias: string,
		pageSize: number,
		lastItem: Status | null,
	): Promise<[Status[], boolean]> {
		// TODO: Replace with the result of calling server
		return FakeData.instance.getPageOfStatuses(lastItem, pageSize);
	}

	public async retrievePageOfStoryItems(
		authToken: AuthToken,
		userAlias: string,
		pageSize: number,
		lastItem: Status | null,
	): Promise<[Status[], boolean]> {
		// TODO: Replace with the result of calling server
		return FakeData.instance.getPageOfStatuses(lastItem, pageSize);
	}
}
