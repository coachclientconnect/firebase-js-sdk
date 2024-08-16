/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  FirebaseApp as AppCompat,
  _FirebaseService
} from '@firebase/app-compat';
import {
  Messaging,
  MessagePayload,
  deleteToken,
  getToken,
  onMessage,
  setSkipForegroundNotifications,
} from '@firebase/messaging';
import {
  areCookiesEnabled,
  isIndexedDBAvailable,
  NextFn,
  Observer,
  Unsubscribe
} from '@firebase/util';

import { onBackgroundMessage } from '@firebase/messaging/sw';

export interface MessagingCompat {
  getToken(options?: {
    vapidKey?: string;
    serviceWorkerRegistration?: ServiceWorkerRegistration;
  }): Promise<string>;

  deleteToken(): Promise<boolean>;

  onMessage(
    nextOrObserver: NextFn<MessagePayload> | Observer<MessagePayload>
  ): Unsubscribe;

  onBackgroundMessage(
    nextOrObserver: NextFn<MessagePayload> | Observer<MessagePayload>
  ): Unsubscribe;

  setSkipForegroundNotifications(skip: boolean): void;
}

export function isSupported(): boolean {
  if (self && 'ServiceWorkerGlobalScope' in self) {
    // Running in ServiceWorker context
    return isSwSupported();
  } else {
    // Assume we are in the window context.
    return isWindowSupported();
  }
}

/**
 * Checks to see if the required APIs exist.
 * Unlike the modular version, it does not check if IndexedDB.open() is allowed
 * in order to keep isSupported() synchronous and maintain v8 compatibility.
 */
function isWindowSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    isIndexedDBAvailable() &&
    areCookiesEnabled() &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window &&
    'fetch' in window &&
    ServiceWorkerRegistration.prototype.hasOwnProperty('showNotification') &&
    PushSubscription.prototype.hasOwnProperty('getKey')
  );
}

/**
 * Checks to see if the required APIs exist within SW Context.
 */
function isSwSupported(): boolean {
  return (
    isIndexedDBAvailable() &&
    'PushManager' in self &&
    'Notification' in self &&
    ServiceWorkerRegistration.prototype.hasOwnProperty('showNotification') &&
    PushSubscription.prototype.hasOwnProperty('getKey')
  );
}

export class MessagingCompatImpl implements MessagingCompat, _FirebaseService {
  constructor(readonly app: AppCompat, readonly _delegate: Messaging) {
    this.app = app;
    this._delegate = _delegate;
  }

  async getToken(options?: {
    vapidKey?: string;
    serviceWorkerRegistration?: ServiceWorkerRegistration;
  }): Promise<string> {
    return getToken(this._delegate, options);
  }

  async deleteToken(): Promise<boolean> {
    return deleteToken(this._delegate);
  }

  onMessage(
    nextOrObserver: NextFn<MessagePayload> | Observer<MessagePayload>
  ): Unsubscribe {
    return onMessage(this._delegate, nextOrObserver);
  }

  onBackgroundMessage(
    nextOrObserver: NextFn<MessagePayload> | Observer<MessagePayload>
  ): Unsubscribe {
    return onBackgroundMessage(this._delegate, nextOrObserver);
  }

  setSkipForegroundNotifications(skip: boolean): void {
    setSkipForegroundNotifications(this._delegate, skip);
  }
}
