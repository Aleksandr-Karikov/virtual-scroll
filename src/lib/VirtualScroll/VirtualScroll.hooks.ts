import { useState, useLayoutEffect, useEffect, useMemo, useCallback, useRef, useInsertionEffect } from "react";

type Key = string | number;

function useLatest<T>(value: T) {
  const valueRef = useRef(value);
  useInsertionEffect(() => {
    valueRef.current = value;
  })
  return valueRef;
}

interface UseFixedSizeListProps {
    itemsCount: number;
    overscan?: number;
    scrollingDelay?: number;
    getScrollElement: () => HTMLElement | null;
    itemsHeight?: (index: number) => number;
    estimateItemHeight?: (index: number) => number;
    getItemKey:  (index: number)  => Key;
}

interface virtualItemElement {
  offsetTop: number,
  index: number,
  key: Key,
  height: number
}

const DEFAULT_OVERSCAN = 3;
const DEFAULT_SCROLLING_DELAY = 150;

function validateProps(props: UseFixedSizeListProps) {
  const {
    estimateItemHeight,
    itemsHeight
  } = props;
  if (!itemsHeight && !estimateItemHeight) {
    throw new Error(
      'You must pass either "estimateItemHeight" or "itemsHeight" props'
    )
  }
}

export function useFixedSizeList(props: UseFixedSizeListProps) {

  validateProps(props);

    const {
        itemsCount,
        itemsHeight,
        overscan = DEFAULT_OVERSCAN,
        scrollingDelay = DEFAULT_SCROLLING_DELAY,
        getScrollElement,
        estimateItemHeight,
        getItemKey
    } = props;
    const [measurementCache, setMeasurementCache] = useState<Record<Key, number>>(
      {}
    );
    const [listHeight, setListHeight] = useState(0);
    const [scrollTop, setScrollTop] = useState(0);
    const [isScrolling, setIsScrolling] = useState(false);

    useLayoutEffect(() => {
    
        const scrollElement = getScrollElement();
        if (!scrollElement) {
          return;
        }
        const handleScroll = () => {
          
          const scrollTop = scrollElement.scrollTop;
          setScrollTop(scrollTop);
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
        const height = entry.borderBoxSize[0].blockSize 
                        ?? entry.target.getBoundingClientRect().height

        setListHeight(height);
      });
      resizeObserver.observe(scrollElement);
      return () => {
        resizeObserver.disconnect();
      }
    },[getScrollElement])

    const {
      virtualItems,
      startIndex,
      endIndex,
      totalHeight,
      allItems
    } = useMemo(() => {

      const getItemHeight = (index: number) => {
        if (itemsHeight) {
          return itemsHeight(index);
        }
        const key = getItemKey(index);
        if (typeof measurementCache[key] === 'number') {
          return measurementCache[key];
        }

        return estimateItemHeight(index);

      }

      const rangeStart = scrollTop;
      let rangeEnd = scrollTop + listHeight;

      let totalHeight = 0;
      let startIndex = -1;
      let endIndex = -1;

      const allRows: virtualItemElement[] = new Array(itemsCount);
      for (let index = 0; index < allRows.length; index++) {

        const key = getItemKey(index);

        const row = {
          key,
          index: index,
          height: getItemHeight(index),
          offsetTop: totalHeight
        };
        totalHeight+=row.height;
        allRows[index] = row;

        if (startIndex === -1 && row.offsetTop + row.height > rangeStart)  {
          startIndex = Math.max(0, index - overscan);
        }
        
        if (index === allRows.length - 1) {
          rangeEnd = totalHeight;
        }

        if (endIndex === -1 && row.offsetTop + row.height >= rangeEnd)  {
          endIndex = Math.min(itemsCount - 1, index + overscan);
        }
      }
      
      const virtualItems = allRows.slice(startIndex, endIndex + 1)

      return {virtualItems, startIndex, endIndex, allItems: allRows, totalHeight};
    },[
      scrollTop, 
      itemsCount, 
      listHeight, 
      itemsHeight,
      overscan, 
      estimateItemHeight, 
      measurementCache
    ]);

    const latestData = useLatest({measurementCache, getItemKey, allItems, scrollTop })

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

      const {getItemKey, measurementCache, allItems, scrollTop} = latestData.current;

      const isResize = !!entry;
      const key = getItemKey(index);

      if (!isResize && typeof measurementCache[key] === 'number') {
        return;
      } 

      const height = entry?.borderBoxSize[0]?.blockSize ?? element.getBoundingClientRect().height;

      if (measurementCache[key] === height) {
        return;
      }

      const item = allItems[index];
      const delta = height - item.height; 
      if (delta !== 0 && scrollTop > item.offsetTop) {
        const element = getScrollElement();
        if (element) {
          element.scrollBy(0, delta);
        }
      }
      setMeasurementCache(cache => ({...cache, [key]: height}))
    }, [])
    
    const itemsResizeObserver = useMemo(() => {
      const observer = new ResizeObserver((entries) => {
        entries.forEach((entry) => measureElementInner(entry.target, observer, entry))
      })
      return observer;
    },[latestData])
    
    const measureElement = useCallback((element: Element | null) => {
      measureElementInner(element, itemsResizeObserver)
    }, [itemsResizeObserver])

    return {
      isScrolling,
      virtualItems,
      startIndex,
      endIndex,
      allItems,
      totalHeight,
      measureElement
    }
}