import { Subject } from "rxjs";
export const createContext = (manifest, loadOptions) => {
    const subject = new Subject();
    const visibleAreaRect = {
        width: 0,
        height: 0,
        x: 0,
        y: 0
    };
    const horizontalMargin = 24;
    const verticalMargin = 20;
    const marginTop = 0;
    const marginBottom = 0;
    // @todo
    const shouldDisplaySpread = () => false;
    return {
        isRTL: () => manifest.readingDirection === 'rtl',
        getLoadOptions: () => loadOptions,
        getCalculatedInnerMargin: () => 0,
        getVisibleAreaRect: () => visibleAreaRect,
        setVisibleAreaRect: (x, y, width, height) => {
            // visibleAreaRect.width = width - horizontalMargin * 2
            visibleAreaRect.width = width;
            visibleAreaRect.height = height - marginTop - marginBottom;
            visibleAreaRect.x = x;
            visibleAreaRect.y = y;
            // if (this.useChromiumRubyBugSafeInnerMargin) {
            //   this.visibleAreaRect.height =
            //     this.visibleAreaRect.height - this.getCalculatedInnerMargin()
            // }
        },
        getHorizontalMargin: () => horizontalMargin,
        getVerticalMargin: () => verticalMargin,
        getPageSize: () => {
            return {
                width: shouldDisplaySpread()
                    ? visibleAreaRect.width / 2
                    : visibleAreaRect.width,
                height: visibleAreaRect.height,
            };
        },
        $: subject.asObservable(),
        emit: (data) => {
            subject.next(data);
        },
        manifest,
    };
};
//# sourceMappingURL=context.js.map