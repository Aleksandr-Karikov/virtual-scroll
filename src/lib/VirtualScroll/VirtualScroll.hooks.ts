import { useState, useLayoutEffect, useEffect, useMemo } from "react";

interface UseFixedSizeListProps {
    itemsCount: number;
    itemsHeight: number;
    listHeight: number;
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
        listHeight,
        overscan = DEFAULT_OVERSCAN,
        scrollingDelay = DEFAULT_SCROLLING_DELAY,
        getScrollElement
    } = props;
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

    const {virtualItems, startIndex, endIndex} = useMemo(() => {

      const rangeStart = scrollTop;
      const rangeEnd = scrollTop + listHeight;
  
      let startIndex = Math.floor(rangeStart / itemsHeight);
      let endIndex = Math.ceil(rangeEnd / itemsHeight);
  
      startIndex = Math.max(0, startIndex - overscan);
      endIndex = Math.min(itemsCount - 1, endIndex + overscan);
      
      const virtualItems = [];
  
  
      for (let index = startIndex; index <= endIndex; index++) {
        virtualItems.push({
          index,
          offsetTop: index * itemsHeight
        })
      }
  
      return {virtualItems, startIndex, endIndex};
  
    },[scrollTop, itemsCount]);
    
    return {isScrolling, virtualItems, startIndex, endIndex }
}