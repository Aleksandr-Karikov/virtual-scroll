import { useState, useLayoutEffect, useEffect, useMemo, useCallback, useRef, useInsertionEffect } from "react";

type Key = string | number;

function useLatest<T>(value: T) {
  const valueRef = useRef(value);
  useInsertionEffect(() => {
    valueRef.current = value;
  })
  return valueRef;
}

interface UseFixedSizeGridProps {
    rowsCount: number;
    columnsCount: number;
    overscanY?: number;
    overscanX?: number;
    scrollingDelay?: number;
    getScrollElement: () => HTMLElement | null;
    columnWidth: (index: number) => number;
    rowHeight?: (index: number) => number;
    estimateRowHeight?: (index: number) => number;
    getRowKey:  (index: number)  => Key;
    getColumnKey:  (index: number)  => Key;
}

interface DynamicSizeGridRow {
  offsetTop: number,
  index: number,
  key: Key,
  height: number
}

interface DynamicSizeGridColumn {
  offsetLeft: number,
  index: number,
  key: Key,
  width: number
}

const DEFAULT_OVERSCAN_Y = 3;
const DEFAULT_OVERSCAN_X = 1;
const DEFAULT_SCROLLING_DELAY = 150;

function validateProps(props: UseFixedSizeGridProps) {
  const {
    estimateRowHeight,
    rowHeight: rowsHeight
  } = props;
  if (!rowsHeight && !estimateRowHeight) {
    throw new Error(
      'You must pass either "estimateRowHeight" or "rowsHeight" props'
    )
  }
}

export function useDinamicSizeGrid(props: UseFixedSizeGridProps) {

  validateProps(props);

    const {
        overscanY = DEFAULT_OVERSCAN_Y,
        overscanX = DEFAULT_OVERSCAN_X,
        scrollingDelay = DEFAULT_SCROLLING_DELAY,
        rowsCount,
        rowHeight,
        columnWidth,
        getScrollElement,
        estimateRowHeight,
        getRowKey,
        columnsCount,
        getColumnKey,
    } = props;
    const [measurementCache, setMeasurementCache] = useState<Record<Key, number>>(
      {}
    );
    const [gridHeight, setGridHeight] = useState(0);
    const [scrollTop, setScrollTop] = useState(0);

    const [gridWidth, setGridWidth] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const [isScrolling, setIsScrolling] = useState(false);

    useLayoutEffect(() => {
    
        const scrollElement = getScrollElement();
        if (!scrollElement) {
          return;
        }
        const handleScroll = () => {
          const {scrollTop, scrollLeft} = scrollElement;

          setScrollTop(scrollTop);
          setScrollLeft(scrollLeft);
        }
        
        scrollElement.addEventListener('scroll', handleScroll);
        return () => {
          scrollElement.removeEventListener('scroll', handleScroll);
        }
      },[getScrollElement])
    
    useEffect(() => {
      
      const scrollElement = getScrollElement();
      if (!scrollElement) {
        return;
      }
      let timeoutId: number|null = null;

      const handleScroll = () => {
        setIsScrolling(true);
      let timeoutId: number|null = null;
        if (typeof timeoutId === 'number') {
          clearTimeout(timeoutId);
        }
        timeoutId = window.setTimeout(() => {
          setIsScrolling(false);
        }, scrollingDelay);
      }
      scrollElement.addEventListener('scroll', handleScroll);
      return () => {
        clearTimeout(timeoutId);
        scrollElement.removeEventListener('scroll', handleScroll);
      }
    },[getScrollElement])

    useLayoutEffect(() => {
      const scrollElement = getScrollElement();
      if (!scrollElement) {
        return;
      }
      const resizeObserver = new ResizeObserver(([entry]) => {
        if (!entry) {
          return;
        }
        const {height, width} = entry.borderBoxSize[0] ?
          {
            height: entry.borderBoxSize[0].blockSize,
            width: entry.borderBoxSize[0].inlineSize
          } 
          : entry.target.getBoundingClientRect()

        setGridHeight(height);
        setGridWidth(width);
      });
      resizeObserver.observe(scrollElement);
      return () => {
        resizeObserver.disconnect();
      }
    },[getScrollElement])

    const {
      virtualRows,
      allRows,
      endIndexRows,
      startIndexRows,
      totalHeight
    } = useMemo(() => {

      const getRowHeight = (index: number) => {
        if (rowHeight) {
          return rowHeight(index);
        }
        const key = getRowKey(index);
        if (typeof measurementCache[key] === 'number') {
          return measurementCache[key];
        }

        return estimateRowHeight(index);

      }

      const rangeStart = scrollTop;
      let rangeEnd = scrollTop + gridHeight;

      let totalHeight = 0;
      let startIndexRows = -1;
      let endIndexRows = -1;

      const allRows: DynamicSizeGridRow[] = new Array(rowsCount);
      for (let index = 0; index < allRows.length; index++) {

        const key = getRowKey(index);

        const row = {
          key,
          index: index,
          height: getRowHeight(index),
          offsetTop: totalHeight
        };
        totalHeight+=row.height;
        allRows[index] = row;

        if (startIndexRows === -1 && row.offsetTop + row.height > rangeStart)  {
          startIndexRows = Math.max(0, index - overscanY);
        }
        
        if (index === allRows.length - 1) {
          rangeEnd = totalHeight;
        }

        if (endIndexRows === -1 && row.offsetTop + row.height >= rangeEnd)  {
          endIndexRows = Math.min(rowsCount - 1, index + overscanY);
        }
      }
      
      const virtualRows = allRows.slice(startIndexRows, endIndexRows + 1)

      return {virtualRows, startIndexRows, endIndexRows, allRows, totalHeight};
    },[
      scrollTop, 
      rowsCount, 
      gridHeight, 
      rowHeight,
      overscanY, 
      estimateRowHeight, 
    ]);

    const {
      allColumns,
      endIndexColumns,
      startIndexColumns,
      totalWidth,
      virtualColumns
    } = useMemo(() => {

      const rangeStart = scrollLeft;
      let rangeEnd = scrollLeft + gridWidth;

      let totalWidth = 0;
      let startIndexColumns = -1;
      let endIndexColumns = -1;

      const allColumns: DynamicSizeGridColumn[] = new Array(columnsCount);
      for (let index = 0; index < allColumns.length; index++) {

        const key = getColumnKey(index);
        const column = {
          key,
          index: index,
          width: columnWidth(index),
          offsetLeft: totalWidth
        };
        totalWidth+=column.width;
        allColumns[index] = column;

        if (startIndexColumns === -1 && column.offsetLeft + column.width > rangeStart)  {
          startIndexColumns = Math.max(0, index - overscanX);
        }
        
        if (index === allColumns.length - 1) {
          rangeEnd = totalWidth;
        }

        if (endIndexColumns === -1 && column.offsetLeft + column.width >= rangeEnd)  {
          endIndexColumns = Math.min(columnsCount - 1, index + overscanX);
        }
      }
      
      const virtualColumns = allColumns.slice(startIndexColumns, endIndexColumns + 1)

      return {virtualColumns, startIndexColumns, endIndexColumns, allColumns, totalWidth};
    },[
      scrollLeft, 
      columnsCount, 
      gridWidth, 
      columnWidth,
      overscanX, 
    ]);

    const latestData = useLatest({measurementCache, getRowKey, allRows, scrollTop: scrollTop })

    const measureElementInner = useCallback((element: Element, resizeObserver: ResizeObserver, entry?: ResizeObserverEntry) => {
      
      if (!element) return;

      if (!element.isConnected) {
        resizeObserver.unobserve(element);
        return;
      }    

      const indexAttribute = element.getAttribute('data-index') || '';
      const index = +indexAttribute;

      if (Number.isNaN(index)) {
        console.error('dynamic elements must have a valid `data-index` attribute');
      }

      const {getRowKey, measurementCache, allRows, scrollTop} = latestData.current;

      const isResize = !!entry;
      const key = getRowKey(index);

      if (!isResize && typeof measurementCache[key] === 'number') {
        return;
      } 

      const height = entry?.borderBoxSize[0].blockSize ?? element.getBoundingClientRect().height;

      if (measurementCache[key] === height) {
        return;
      }

      const row = allRows[index];
      const delta = height - row.height; 
      if (delta !== 0 && scrollTop > row.offsetTop) {
        const element = getScrollElement();
        if (element) {
          element.scrollBy(0, delta);
        }
      }
      setMeasurementCache(cache => ({...cache, [key]: height}))
    }, [])
    
    const rowsResizeObserver = useMemo(() => {
      const observer = new ResizeObserver((entries) => {
        entries.forEach((entry) => measureElementInner(entry.target, observer, entry))
      })
      return observer;
    },[latestData])
    
    const measureElement = useCallback((element: Element | null) => {
      measureElementInner(element, rowsResizeObserver)
    }, [rowsResizeObserver])
    
    return {
      isScrolling,
      virtualRows,
      virtualColumns,
      allColumns,
      allRows,
      startIndexColumns,
      startIndexRows,
      endIndexColumns, 
      endIndexRows,
      measureElement,
      totalHeight,
      totalWidth
    }
}