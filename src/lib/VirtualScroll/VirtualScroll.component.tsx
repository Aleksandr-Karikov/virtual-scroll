import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import cls from './VirtualScroll.module.css'
import { useFixedSizeList } from './VirtualScroll.hooks';
import {faker} from '@faker-js/faker';
const items = Array.from({length: 10_000}, (_, index) => ({
  id: Math.random().toString(36).slice(2),
  text: faker.lorem.text()
}))
export const VirtualScroll = () => {
  const [listItems, setListItems] = useState(items);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  const {
    virtualItems, 
    isScrolling,
    totalHeight,
    measureElement
    } = useFixedSizeList({
    getScrollElement: useCallback(() => scrollElementRef.current, []),
    itemsCount: listItems.length,
    estimateItemHeight: useCallback(() => 40, []),
    getItemKey: useCallback((index) => listItems[index]!.id, [listItems])
  })

  return (
    <>
        <button onClick={() => setListItems(items => items.slice().reverse())}>reverse</button>
        <div ref={scrollElementRef} className={cls.wrap}>
          <div className={cls.content} style={{height: `${totalHeight}px`}}>
          {
            virtualItems.map(({index, offsetTop, height}) => {
              const item = listItems[index];
              return (
                <div 
                  key={item.id}
                  data-index={index}
                  ref={measureElement}
                  style={{
                    padding: '10px',
                    position: 'absolute',
                    top:0,
                    transform: `translateY(${offsetTop}px)`
                  }} 
                  
                >
                  {index} - {item.text}
                </div>
              )
            })
          }
          </div>
        </div>
    </>

  )
}
