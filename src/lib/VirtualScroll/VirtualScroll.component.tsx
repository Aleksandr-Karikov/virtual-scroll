import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import cls from './VirtualScroll.module.css'
import { useFixedSizeList } from './VirtualScroll.hooks';

const items = new Array(10000).fill(null).map((item, index) => (
  {
    text: " ipsum dolor sit amet consectetur adipisicing elit. Rem possimus repellat iusto corporis architecto veritatis facilis ab iure accusantium temporibus?",
    id: Math.random().toString(36).slice(2)
   }
))
const test = (index) => {
  return 40 + Math.round(10 * Math.random())
}

export const VirtualScroll = () => {
  const [listItems, setListItems] = useState(items);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  const {virtualItems, isScrolling, totalHeight} = useFixedSizeList({
    itemsHeight: test, 
    getScrollElement: () => scrollElementRef.current,
    itemsCount: listItems.length
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
                  style={{
                    height: `${height}px`,
                    position: 'absolute',
                    top:0,
                    transform: `translateY(${offsetTop}px)`
                  }} 
                  key={item.id}
                >
                  {isScrolling ? 'scrolling' : index}
                </div>
              )
            })
          }
          </div>
        </div>
    </>

  )
}
