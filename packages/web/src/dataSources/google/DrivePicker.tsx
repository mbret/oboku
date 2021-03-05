import { FC, useEffect, useMemo, useRef } from 'react'
import { DEVELOPER_KEY, APP_ID } from './constants'
import { useGetLazySignedGapi } from './helpers'

export const DrivePicker: FC<{
  show: boolean,
  onClose: (data: {
    action?: string,
    docs?: {
      name?: string,
      // description: ""
      // driveSuccess: true
      // embedUrl: "https://drive.google.com/file/d/1CBRtljItFwiBfvbGPv51UBKI1016wCOn/preview?usp=drive_web"
      // iconUrl: "https://drive-thirdparty.googleusercontent.com/16/type/application/x-cbz"
      id: "1CBRtljItFwiBfvbGPv51UBKI1016wCOn"
      // lastEditedUtc: 1608550030000
      // mimeType: "application/x-cbz"
      // name: "[Michiking] Ane Taiken Shuukan _ The Older Sister Experience for a Week ch. 1-5+SP [English] [PSYN] [Digital].cbz"
      // parentId: "1bCaFCoGe5fKoH-s_k6-pmzy9MCdMQ53h"
      // serviceId: "DoclistBlob"
      // sizeBytes: 71088242
      // type: "file"
      // url: "https://drive.google.com/file/d/1CBRtljItFwiBfvbGPv51UBKI1016wCOn/view?usp=drive_web"
    }[]
  } | Error) => void,
  select: 'folder' | 'file'
}> = ({ show, onClose, select }) => {
  const [getSignedGapi, gapi, { error }] = useGetLazySignedGapi()
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const accessToken = gapi?.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token

  const picker = useMemo(() => {
    let picker = new google.picker.PickerBuilder()
      .addView(
        new google.picker.DocsView()
          .setIncludeFolders(true)
          .setSelectFolderEnabled(select === 'folder' ? true : false)
      )
      .setOAuthToken(accessToken || '')
      .setDeveloperKey(DEVELOPER_KEY)
      .setAppId(APP_ID)
      .setCallback(async (data) => {
        onCloseRef.current(data)
      })

    if (select === 'file') {
      // picker = picker.setSelectableMimeTypes('application/vnd.google-apps.file')
    } else {
      picker = picker.setSelectableMimeTypes('application/vnd.google-apps.folder')
    }

    return picker.build()

  }, [accessToken, select])

  useEffect(() => {
    if (error) {
      onClose(error)
    }
  }, [error, onClose])

  useEffect(() => {
    if (show && !accessToken) {
      getSignedGapi()
    }
    if (show && accessToken) {
      picker.setVisible(true)
    } else {
      picker.setVisible(false)
    }
  }, [show, picker, accessToken, getSignedGapi])

  return null
}