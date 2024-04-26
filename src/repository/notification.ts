import Notification, { NotificationModel } from "../model/notification";
import { ClientSession, Model } from "mongoose";
import DBLayer, { PaginationRequestData, updateManyQuery } from "./shared";
import { INotification } from "../model/interfaces";

class NotificationRepository {
  private notificationDBLayer: DBLayer<NotificationModel>;

  constructor(model: Model<NotificationModel>) {
    this.notificationDBLayer = new DBLayer<NotificationModel>(model);
  }

  async createNotification(
    request: INotification,
    session?: ClientSession
  ): Promise<NotificationModel[]> {
    let createdNotifications: NotificationModel[] = [];

    createdNotifications = await this.notificationDBLayer.createDocs(
      [request],
      session
    );

    return createdNotifications;
  }

  async returnPaginatedNotifications(request: PaginationRequestData) {
    const paginatedNotifications = await this.notificationDBLayer.paginateData(
      request
    );

    return paginatedNotifications;
  }

  async updateNotification(request: {
    docToUpdate: { [key: string]: Record<"$eq", string> };
    updateData: { [k: string]: string | object | boolean };
    options: {
      new?: boolean;
      session?: ClientSession;
      select?: string;
      upsert?: boolean;
      includeResultMetadata?: boolean;
    };
  }) {
    const updatedNotification = await this.notificationDBLayer.updateDoc({
      docToUpdate: request.docToUpdate,
      updateData: request.updateData,
      options: request.options,
    });

    return updatedNotification;
  }

  async updateManyNotifications(request: updateManyQuery<NotificationModel>) {
    const result = await this.notificationDBLayer.updateManyDocs(request);

    return result;
  }
}

export const NotificationDataLayer = new NotificationRepository(Notification);

export default NotificationRepository;
