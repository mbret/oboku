import { useHistory } from "react-router-dom";
import { useRecoilCallback } from "recoil";
import { ROUTES } from "../../constants";
import { useDownloadFile } from "../../download/useDownloadFile";
import { enrichedBookState } from "../states";

export const useDefaultItemClickHandler = () => {
  const downloadFile = useDownloadFile()
  const history = useHistory();

  return useRecoilCallback(({ snapshot }) => async (id: string) => {
    const item = await snapshot.getPromise(enrichedBookState(id))
    // if (!item?.lastMetadataUpdatedAt) return
    if (item?.downloadState === 'none') {
      item?._id && downloadFile(item?._id)
    } else if (item?.downloadState === 'downloaded') {
      history.push(ROUTES.READER.replace(':id', item?._id))
    }
  }, [])
}