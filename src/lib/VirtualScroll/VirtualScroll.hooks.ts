import { useState, useLayoutEffect, useEffect, useMemo } from "react";

interface UseFixedSizeListProps {
    itemsCount: number;
    itemsHeight: (index: number) => number;
    overscan?: number;
    scrollingDelay?: number;
    getScrollElement: () => HTMLElement | null;
}

const DEFAULT_OVERSCAN = 3;
const DEFAULT_SCROLLING_DELAY = 150;

export function useFixedSizeList(props: UseFixedSizeListProps) {
    const {
        itemsCount,
        itemsHeight,
        overscan = DEFAULT_OVERSCAN,
        scrollingDelay = DEFAULT_SCROLLING_DELAY,
        getScrollElement
    } = props;
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
        const height = 
        entry.borderBoxSize[0].blockSize 
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

      const rangeStart = scrollTop;
      let rangeEnd = scrollTop + listHeight;

      let totalHeight = 0;
      let startIndex = -1;
      let endIndex = -1;
      const allRows = new Array(itemsCount);
      for (let index = 0; index < allRows.length; index++) {
        const row = {
          index: index,
          height: itemsHeight(index),
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
  
    },[scrollTop, itemsCount, listHeight, itemsHeight, overscan]);

    return {
      isScrolling,
      virtualItems,
      startIndex,
      endIndex,
      allItems,
      totalHeight
    }
}