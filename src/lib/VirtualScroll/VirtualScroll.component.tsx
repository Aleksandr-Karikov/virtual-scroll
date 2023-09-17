import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import cls from './VirtualScroll.module.css'
import { useFixedSizeList } from './VirtualScroll.hooks';

const items = new Array(10000).fill(null).map((item, index) => (
  {
    text: " ipsum dolor sit amet consectetur adipisicing elit. Rem possimus repellat iusto corporis architecto veritatis facilis ab iure accusantium temporibus?",
    id: Math.random().toString(36).slice(2)
   }
))
const itemHeight = 40;
const containerHeight = 500;

export const VirtualScroll = () => {
  const [listItems, setListItems] = useState(items);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  const {virtualItems, isScrolling} = useFixedSizeList({
    itemsHeight: itemHeight, 
    listHeight: containerHeight,
    getScrollElement: () => scrollElementRef.current,
    itemsCount: listItems.length
  })

  const totalHeight = itemHeight * listItems.length;

  return (
    <>
        {/* <button onClick={handleRevert}>reverse</button> */}
        <div ref={scrollElementRef} className={cls.wrap}  style={{height: `${containerHeight}px`  }}>
          <div className={cls.content} style={{height: `${totalHeight}px`}}>
          {
            virtualItems.map(({index, offsetTop}) => {
              const item = listItems[index];
              return (
                <div 
                  style={{
                    height: `${itemHeight}px`,
                    position: 'absolute',
                    top:0,
                    transform: `translateY(${offsetTop}px)`
                  }} 
                  key={item.id}
                >
                  {isScrolling ? 'scrolling' : item.id}
                </div>
              )
            })
          }
          </div>
        </div>
    </>

  )
}
