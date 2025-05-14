/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
 * Licensed under the Apache License,Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

//Importing the program access control management module
import abilityAccessCtrl, { Permissions } from '@ohos.abilityAccessCtrl'

//Import common
import common from '@ohos.app.ability.common'
import window from '@ohos.window'

import { onNativePermissionResult } from '../service/InvokeNative'

import hilog from '@ohos.hilog'

const APPROVAL: number = 0

//Logging Tags for Modules
const TAG = '------[Applicant] '

let Permissionsmap: Map<string, Permissions> = new Map()
Permissionsmap.set('ohos.permission.WRITE_MEDIA', 'ohos.permission.WRITE_MEDIA')
Permissionsmap.set('ohos.permission.MICROPHONE', 'ohos.permission.MICROPHONE')

//Default exported module interfaces
export default function requestPermissionFromUsers(context: common.UIAbilityContext, permission: string) {

  let permissionsList: Array<Permissions> = []
  permissionsList.push(Permissionsmap.get(permission))
  //The state of the result of a predefined function execution
  let isFinished: boolean = false

  //Creating an instance of AtManager
  let atManager = abilityAccessCtrl.createAtManager()

  hilog.info(0x0000, 'EGLAPP', 'Main begin to deal requestPermission msg')

  //Waiting for the program access control module to complete the asynchronous operation of the permission request
  atManager.requestPermissionsFromUser(context, permissionsList).then((result) => {

    hilog.info(0x0000, 'EGLAPP', 'Main real requestPermissionsFromUser.')
    //Store the data returned by the API into the variable grantStatus
    let grantStatus: Array<number> = result.authResults

    //Determine whether a user has provided all relevant permissions
    for (let i = 0; i < grantStatus.length; i++) {
      if (grantStatus[i] === APPROVAL) { //User provides all privileges
        console.info(TAG + 'Succeed! Obtain all the permissions')
        onNativePermissionResult(true)
      } else { //User does not provide all privileges
        onNativePermissionResult(false)
      }
    }
  }).catch((err) => {
    console.error(TAG + `Request permission failed, code is ${err.code}, message is ${err.message}`)
  })

  return isFinished

}

export function setOrientationBis(mContext: common.UIAbilityContext, w: number, h: number, resizable: number, hint: string): void {
  let orientation_landscape = -1
  let orientation_portrait = -1
  if (hint.includes('LandscapeRight') && hint.includes('LandscapeLeft')) { //Include these two strings to set the reverse horizontal screen
    orientation_landscape = window.Orientation.AUTO_ROTATION_LANDSCAPE
  } else if (hint.includes('LandscapeRight')) {
    orientation_landscape = window.Orientation.LANDSCAPE
  } else if (hint.includes('LandscapeLeft')) {
    orientation_landscape = window.Orientation.LANDSCAPE_INVERTED
  }

  if (hint.includes("Portrait") && hint.includes("PortraitUpsideDown")) {
    orientation_portrait = window.Orientation.AUTO_ROTATION_PORTRAIT
  } else if (hint.includes('Portrait')) {
    orientation_portrait = window.Orientation.PORTRAIT
  } else if (hint.includes('PortraitUpsideDown')) {
    orientation_portrait = window.Orientation.PORTRAIT_INVERTED
  }
  let is_landscape_allowed: boolean = (orientation_landscape === -1 ? false : true)
  let is_portrait_allowed: boolean = (orientation_portrait === -1 ? false : true)
  let req = -1

  if (!is_portrait_allowed && !is_landscape_allowed) {
    if (resizable) {
      req = window.Orientation.AUTO_ROTATION
    } else {
      req = (w > h ? window.Orientation.AUTO_ROTATION_LANDSCAPE : window.Orientation.AUTO_ROTATION_PORTRAIT)
    }
  } else {
    if (resizable) {
      if (is_portrait_allowed && is_landscape_allowed) {
        req = window.Orientation.AUTO_ROTATION
      } else {
        req = (is_landscape_allowed ? orientation_landscape : orientation_portrait)
      }
    } else {
      if (is_portrait_allowed && is_landscape_allowed) {
        req = (w > h ? orientation_landscape : orientation_portrait)
      } else {
        req = (is_landscape_allowed ? orientation_landscape : orientation_portrait)
      }
    }
  }
  console.log("SDL", "setOrientation() requestedOrientation=" + req + " width=" + w + " height=" + h + " resizable=" + resizable + " hint=" + hint)

  window.getLastWindow(mContext).then((win) => {
    win.setPreferredOrientation(req).then(() => {
      console.log("setPreferredOrientation success")
    })
  })
}


export function Request_SetWindowStyle(mContext: common.UIAbilityContext, fullscree: boolean) {
  console.log("in OHOS_NAPI_SetWindowStyle ")
  try {
    let promise = window.getLastWindow(mContext).then((win) => {
      win.setWindowLayoutFullScreen(fullscree)
      promise.then(() => {
        console.info('Succeeded in setting the window layout to full-screen mode.')
      }).catch((err) => {
        console.error('Failed to set the window layout to full-screen mode. Cause:' + JSON.stringify(err))
      })
    })
  } catch (exception) {
    console.error('Failed to set the window layout to full-screen mode. Cause:' + JSON.stringify(exception))
  }
}
