var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { getArchiveOpfInfo } from "../archiveHelpers";
export const generateResourceResponse = (archive, resourcePath) => __awaiter(void 0, void 0, void 0, function* () {
    const { data: opsFile, basePath: opfBasePath } = getArchiveOpfInfo(archive);
    const treatAsImageArchive = !opsFile;
    if (treatAsImageArchive) {
        const file = Object.values(archive.files).find(file => file.name === resourcePath);
        if (!file) {
            throw new Error('no file found');
        }
        const imgAsBase64 = yield (file === null || file === void 0 ? void 0 : file.base64());
        const htmlFile = `
      <!DOCTYPE html>
      <html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en" lang="en">
        <head></head>
        <body>
        <img 
          xmlns="http://www.w3.org/1999/xhtml" 
          src="data:image/jpeg;base64, ${imgAsBase64}" 
          alt="img"
          style="width: 100%;height:100%;object-fit:contain;"
        />
        </body>
      </html>
    `;
        const response = new Response(htmlFile, {
            status: 200, headers: {
                'Content-Type': `text/html; charset=UTF-8`,
                'Cache-Control': `no-cache, no-store, no-transform`
            }
        });
        // cache.put(event.request, response.clone())
        return response;
    }
    else {
        const file = Object.values(archive.files).find(file => file.name === resourcePath);
        if (!file) {
            throw new Error('no file found');
        }
        // console.log(file)
        const response = new Response(yield file.blob(), {
            status: 200,
            headers: Object.assign(Object.assign(Object.assign({}, file.name.endsWith(`.css`) && {
                'Content-Type': `text/css; charset=UTF-8`
            }), file.name.endsWith(`.jpg`) && {
                'Content-Type': `image/jpg`
            }), { 'Cache-Control': `no-cache, no-store, no-transform` })
        });
        // cache.put(event.request, response.clone())
        return response;
    }
});
//# sourceMappingURL=resources.js.map