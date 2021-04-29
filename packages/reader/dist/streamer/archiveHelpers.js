export const getArchiveOpfInfo = (archive) => {
    const filesAsArray = Object.values(archive.files).filter(file => !file.dir);
    const file = filesAsArray.find(file => file.name.endsWith(`.opf`));
    return {
        data: file,
        basePath: file === null || file === void 0 ? void 0 : file.name.substring(0, file.name.lastIndexOf(`/`))
    };
};
//# sourceMappingURL=archiveHelpers.js.map