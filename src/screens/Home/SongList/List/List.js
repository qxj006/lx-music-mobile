import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react'
import { Text, StyleSheet, FlatList, View } from 'react-native'

import ListItem from './ListItem'
import LoadingMask from '@/components/common/LoadingMask'
import { useTranslation } from '@/plugins/i18n'
import { useDispatch, useGetter, subscribe } from '@/store'

export default ({ width }) => {
  const unSubscribeRef = useRef()
  const initedRef = useRef(false)
  const isLoading = useRef(false)
  const [isListRefreshing, setIsListRefreshing] = useState(false)
  const listInfo = useGetter('songList', 'listInfo')
  const getList = useDispatch('songList', 'getList')
  const setSelectListInfo = useDispatch('songList', 'setSelectListInfo')
  const setVisibleListDetail = useDispatch('songList', 'setVisibleListDetail')
  const theme = useGetter('common', 'theme')
  const songListSource = useGetter('songList', 'songListSource')
  const songListSortId = useGetter('songList', 'songListSortId')
  const songListTagInfo = useGetter('songList', 'songListTagInfo')
  const [page, setPage] = useState(0)
  const { t } = useTranslation()

  useEffect(() => {
    if (!initedRef.current) return
    setPage(1)
    getList({ page: 1 })
  }, [songListSource, songListSortId, songListTagInfo, getList])

  useEffect(() => {
    unSubscribeRef.current = subscribe('common.nav.navActiveIndex', () => {
      if (!isListRefreshing) return
      setIsListRefreshing(false)
    })

    setPage(1)
    getList({ page: 1 })
    initedRef.current = true
    return unSubscribeRef.current
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])


  const handleListLoadMore = useCallback(() => {
    if (listInfo.isLoading || listInfo.isEnd) return
    isLoading.current = true
    setPage(listInfo.page + 1)
    getList({ page: listInfo.page + 1 }).finally(() => {
      isLoading.current = false
    })
  }, [getList, listInfo])

  const handleListRefresh = useCallback(() => {
    setIsListRefreshing(true)
    setPage(1)
    getList({ pahe: 1, isRefresh: true }).finally(() => {
      setIsListRefreshing(false)
    })
  }, [getList])

  const handleListPress = useCallback((item, index) => {
    // console.log(item)
    setSelectListInfo(item)
    setVisibleListDetail(true)
  }, [setSelectListInfo, setVisibleListDetail])

  const itemWidth = useMemo(() => Math.max(parseInt(width * 0.125), 110), [width])
  const rowNum = useMemo(() => Math.floor(width / itemWidth), [itemWidth, width])
  const list = useMemo(() => {
    const list = [...listInfo.list]
    let whiteItemNum = (list.length % rowNum)
    if (whiteItemNum > 0) whiteItemNum = rowNum - whiteItemNum
    for (let i = 0; i < whiteItemNum; i++) list.push({ id: `white__${i}` })
    return list
  }, [listInfo, rowNum])
  // console.log(listInfo.list.map((item) => item.id))

  const renderItem = useCallback(data => (
    <ListItem data={data} width={itemWidth} onPress={handleListPress} />
  ), [handleListPress, itemWidth])

  const ListComponent = useMemo(() => <FlatList
    style={styles.list}
    columnWrapperStyle={{ justifyContent: 'space-evenly' }}
    numColumns={rowNum}
    data={list}
    renderItem={renderItem}
    keyExtractor={item => String(item.id)}
    key={rowNum}
    onRefresh={handleListRefresh}
    refreshing={isListRefreshing}
    onEndReached={handleListLoadMore}
    // onEndReachedThreshold={0.5}
    ListFooterComponent={
      listInfo.isEnd
        ? null
        : <View style={{ alignItems: 'center', padding: 10 }}><Text style={{ color: theme.normal30 }}>{t('loading')}</Text></View>
    }
    removeClippedSubviews={true}
  />, [rowNum, list, renderItem, handleListRefresh, isListRefreshing, handleListLoadMore, listInfo, theme, t])

  const visibleLoadingMask = useMemo(() => page == 1 && listInfo.isLoading, [listInfo.isLoading, page])

  const loadingMaskmomponent = useMemo(() => (
    <LoadingMask visible={visibleLoadingMask} />
  ), [visibleLoadingMask])

  // console.log('render song list')
  return (
    <View style={styles.container}>
      { width == 0 ? null : ListComponent}
      { loadingMaskmomponent }
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    flex: 1,
    paddingLeft: 10,
    paddingRight: 10,
  },
})

