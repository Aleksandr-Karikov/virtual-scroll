import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import cls from './VirtualScroll.module.css'
import { useDinamicSizeGrid } from './VirtualScroll.hooks';
import {faker} from '@faker-js/faker';

const gridSize = 100;

const items = Array.from({length: gridSize}, (_) => ({
  id: Math.random().toString(36).slice(2),
  columns: Array.from({length: gridSize}, (_) => ({
    text: faker.word.words(10),
    id: Math.random().toString(36).slice(2),
  }))
}))
export const VirtualScroll = () => {
  const [grid, setGrid] = useState(items);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  const {
    virtualRows,
    virtualColumns,
    isScrolling,
    totalHeight,
    measureElement,
    totalWidth
    } = useDinamicSizeGrid({
      getScrollElement: useCallback(() => scrollElementRef.current, []),
      rowsCount: gridSize,
      estimateRowHeight: useCallback(() => 72, [grid]),
      getRowKey: useCallback((index) => grid[index]!.id, [grid]),
      getColumnKey: useCallback((index) => index, []),
      columnsCount: gridSize + 1,
      columnWidth: useCallback(() => 200, [grid]),
    })

  const reverse = () => {
    setGrid((grid) => grid
        .map(row => ({
          ...row,
          columns: row.columns.slice().reverse()
        }))
        .reverse()
      )
  }
  return (
    <>
        <button onClick={reverse}>reverse</button>
        <div ref={scrollElementRef} className={cls.wrap}>
          <div className={cls.content} style={{height: `${totalHeight}px`, width: `${totalWidth}px`}}>
          {
            virtualRows.map(({index, offsetTop, height}, row) => {
              const item = grid[index];
              return (
                <div 
                  key={item.id}
                  data-index={index}
                  ref={measureElement}
                  style={{
                    padding: '10px',
                    position: 'absolute',
                    display: 'flex',
                    top:0,
                    transform: `translateY(${offsetTop}px)`
                  }} 
                  
                >
                  {
                    virtualColumns.map(({offsetLeft}, index) => {
                      const {id, text} = item.columns[index]
                      console.log(index, offsetLeft);
                      return (
                        <div key={id} style={{width: 200, marginLeft: index === 0 ? `${offsetLeft}px` : 0}}>
                          {text}
                        </div>
                      )
                    })
                  }
                </div>
              )
            })
          }
          </div>
        </div>
    </>

  )
}
