import React, { Component } from "react";
import { Book, Contents, Rendition } from 'epubjs'
import { BookOptions } from "epubjs/types/book"
import { RenditionOptions } from "epubjs/types/rendition"
import { Report } from "../report";

interface Toc {
  label: string;
  href: string;
}

interface EpubViewStyles {
  viewHolder: React.CSSProperties;
  view: React.CSSProperties;
}

export class EpubView extends Component<{
  url: string | ArrayBuffer;
  epubInitOptions?: BookOptions;
  epubOptions?: RenditionOptions;
  styles?: EpubViewStyles;
  loadingView?: React.ReactNode;
  location?: string | number;
  showToc?: boolean;
  locationChanged?(value: string | number): void;
  tocChanged?(value: Toc): void;
  getRendition?(rendition: Rendition): void;
  handleKeyPress?(): void;
  handleTextSelected?(cfiRange: string, contents: Contents): void;
}, any> {
  book: Book | null
  location: any
  viewerRef: any
  rendition: any
  prevPage: any
  nextPage: any

  constructor(props) {
    super(props);
    this.state = {
      isLoaded: false,
      toc: []
    };
    this.viewerRef = React.createRef();
    this.location = props.location;
    this.book = this.rendition = this.prevPage = this.nextPage = null;
  }

  componentDidMount() {
    this.initBook();
    document.addEventListener("keyup", this.handleKeyPress, false);
  }

  initBook() {
    const { url, tocChanged, epubInitOptions } = this.props;
    if (this.book) {
      this.book.destroy();
    }
    this.book = new Book(url as any, epubInitOptions);

    this.book.loaded.navigation.then(({ toc }) => {
      this.setState(
        {
          isLoaded: true,
          toc: toc
        },
        () => {
          tocChanged && tocChanged(toc as any);
          this.initReader();
        }
      );
    });
  }

  componentWillUnmount() {
    this.book = this.rendition = this.prevPage = this.nextPage = null;
    document.removeEventListener("keyup", this.handleKeyPress, false);
  }

  shouldComponentUpdate(nextProps) {
    return (
      !this.state.isLoaded ||
      nextProps.location !== this.props.location ||
      nextProps.location !== this.props.location
    );
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.location !== this.props.location &&
      this.location !== this.props.location
    ) {
      this.rendition.display(this.props.location);
    }
    if (prevProps.url !== this.props.url) {
      this.initBook();
    }
  }

  initReader() {
    const { toc } = this.state;
    const { location, epubOptions, getRendition } = this.props;
    const node = this.viewerRef.current;

    this.rendition = this.book?.renderTo(node, {
      contained: true,
      width: "100%",
      height: "100%",
      ...epubOptions
    } as any);

    const spine_get = this.rendition.book.spine.get.bind(this.rendition.book.spine);
    // @see http://epubjs.org/documentation/0.3/#spineget
    this.rendition.book.spine.get = function (this: Rendition['book']['spine'], target) {
      let t = spine_get(target);
      if (t === null) {
        // Sometime the spine is completely broken and t will be null.
        // in this case we try to return the first item. It might end up on the first page of current
        // chapter.
        // Once we get on a valid spine it should be working correctly
        return spine_get(0)
      }
      return t;
    }

    this.rendition.on('displayError', e => {
      Report.error(e)
    })

    this.prevPage = () => {
      this.rendition.prev();
    };
    this.nextPage = () => {
      this.rendition.next();
    };
    this.registerEvents();
    getRendition && getRendition(this.rendition);

    if (typeof location === "string" || typeof location === "number") {
      this.rendition.display(location);
    } else if (toc.length > 0 && toc[0].href) {
      this.rendition.display(toc[0].href);
    } else {
      this.rendition.display();
    }
  }

  registerEvents() {
    const { handleKeyPress, handleTextSelected } = this.props;
    this.rendition.on("locationChanged", this.onLocationChange);
    this.rendition.on("keyup", handleKeyPress || this.handleKeyPress);
    if (handleTextSelected) {
      this.rendition.on('selected', handleTextSelected);
    }
  }

  onLocationChange = loc => {
    const { location, locationChanged } = this.props;
    const newLocation = loc && loc.start;
    if (location !== newLocation) {
      this.location = newLocation;
      locationChanged && locationChanged(newLocation);
    }
  };

  renderBook() {
    const { styles } = this.props;
    return <div ref={this.viewerRef} style={styles?.view || defaultStyles?.view} />;
  }

  handleKeyPress = ({ key }) => {
    key && key === "ArrowRight" && this.nextPage();
    key && key === "ArrowLeft" && this.prevPage();
  };

  render() {
    const { isLoaded } = this.state;
    const { loadingView, styles } = this.props;
    return (
      <div style={styles?.viewHolder || defaultStyles.viewHolder}>
        {(isLoaded && this.renderBook()) || loadingView}
      </div>
    );
  }
}

const defaultStyles = {
  viewHolder: {
    position: "relative",
    height: "100%",
    width: "100%"
  } as React.CSSProperties,
  view: {
    height: "100%"
  }
};