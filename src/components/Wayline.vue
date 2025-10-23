<template>
  <div id="missionMapContainer"></div>
  <!-- 右上角控件 -->
  <div class="map-control top-right">
    <h3>无人机路径信息</h3>
    <p>起点：{{ startPoint || "未选择" }}</p>
    <p>终点：{{ endPoint || "未选择" }}</p>
    <p>区域面积：{{ area == null ? "未确定测量区域" : area + "㎡" }}</p>
    <a-input-search id="search" v-model:value="keyword" placeholder="请输入要查询的地点" @change="onSearch"
      @search="onSearch"></a-input-search>
  </div>
  <div class="map-control" id="panel"></div>
  <!-- 右下角控件 -->
  <div class="map-control bottom-right vertical-buttons">
    <a-button @click="switchLayer">{{ isSat ? "切换至标准图" : "切换至卫星图" }}</a-button>
    <a-button @click="reset">重置</a-button>
    <a-button type="primary" @click="">确认</a-button>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, reactive, ref } from "vue";
import AMapLoader from "@amap/amap-jsapi-loader";
import startPointImage from "../assets/images/startpoint.png";
import endPointImage from "../assets/images/endpoint.png";

let map = null, startIcon = null, endIcon = null, startPoint = ref(null), endPoint = ref(null), area = ref(null);
let missionFormData = null, rectangle = null;
let markers = [];
let keyword = ref(null);
let placeSearch = null;
let satellite = null;
let isSat = ref(null);
onMounted(() => {
  window._AMapSecurityConfig = {
    securityJsCode: "f0940ffece4b11b4c2dc051ae426b753",
  };
  AMapLoader.load({
    key: "9dbe774f6416fa50ed53784db1335788", // 申请好的Web端开发者Key，首次调用 load 时必填
    version: "2.0", // 指定要加载的 JSAPI 的版本，缺省时默认为 1.4.15
    plugins: ["AMap.Scale"], //需要使用的的插件列表，如比例尺'AMap.Scale'，支持添加多个如：['...','...']
  })
    .then((AMap) => {
      map = new AMap.Map("missionMapContainer", {
        viewMode: "3D", // 是否为3D地图模式
        zoom: 14, // 初始化地图级别
        center: [106.46, 26.02], // 初始化地图中心点位置
        defaultCursor: "pointer",
      });

      satellite = new AMap.TileLayer.Satellite();
      map.addLayer(satellite);
      isSat.value = false;
      satellite.hide();

      startIcon = new AMap.Icon({
        size: new AMap.Size(30, 30), //图标尺寸
        image: startPointImage, //Icon 的图像
        imageSize: new AMap.Size(30, 30), //根据所设置的大小拉伸或压缩图片
      });

      endIcon = new AMap.Icon({
        size: new AMap.Size(30, 30), //图标尺寸
        image: endPointImage, //Icon 的图像
        imageSize: new AMap.Size(30, 30), //根据所设置的大小拉伸或压缩图片
      });

      map.on('click', handleClick);

      AMap.plugin(["AMap.PlaceSearch"], function () {
        placeSearch = new AMap.PlaceSearch({ //构造地点查询类
          pageSize: 5, // 单页显示结果条数
          pageIndex: 1, // 页码
          city: "长顺", // 兴趣点城市
          citylimit: true,  //是否强制限制在设置的城市内搜索
          map: map, // 展现结果的地图实例
          panel: "panel", // 结果列表将在此容器中进行展示。
          autoFitView: false // 是否自动调整地图视野使绘制的 Marker点都处于视口的可见范围
        });

      });
    })
    .catch((e) => {
      console.log(e);
    });




  missionFormData = sessionStorage.getItem('missionFormData');
  console.log(missionFormData);


});


function switchLayer() {
  if (isSat.value) {
    isSat.value = false;
    satellite.hide();
  } else {
    isSat.value = true;
    satellite.show();
  }
}
;
function onSearch() {
  //关键字查询
  placeSearch.search(keyword.value);
}
function handleClick(e) {
  let pos = [e.lnglat.getLng(), e.lnglat.getLat()];
  if (markers.length == 0) {
    const marker = new AMap.Marker({
      position: new AMap.LngLat(pos[0], pos[1]), //点标记的位置
      icon: startIcon, //添加 Icon 实例
      zooms: [2, 20], //点标记显示的层级范围，超过范围不显示
      offset: new AMap.Pixel(-15, -30)
    })
    markers.push(marker);
    startPoint.value = pos;
    map.add(marker);
  } else if (markers.length == 1) {
    const marker = new AMap.Marker({
      position: new AMap.LngLat(pos[0], pos[1]), //点标记的位置
      icon: endIcon, //添加 Icon 实例
      zooms: [2, 20], //点标记显示的层级范围，超过范围不显示
      offset: new AMap.Pixel(-15, -30)
    })
    markers.push(marker);
    endPoint.value = pos;
    map.add(marker);


    var southWest = new AMap.LngLat(startPoint.value[0], endPoint.value[1])
    var northEast = new AMap.LngLat(endPoint.value[0], startPoint.value[1])

    var bounds = new AMap.Bounds(southWest, northEast)
    rectangle = new AMap.Rectangle({
      bounds: bounds,
      strokeColor: 'red',
      strokeWeight: 2,
      strokeOpacity: 0.5,
      strokeDasharray: [30, 10],
      // strokeStyle还支持 solid
      strokeStyle: 'solid',
      fillColor: '#87CEFA',
      fillOpacity: 0.5,
      cursor: 'pointer',
      zIndex: 50,
    })
    map.add(rectangle);

    let path = [bounds.getSouthWest(), bounds.getNorthWest(), bounds.getNorthEast(), bounds.getSouthEast()];
    area.value = Math.round(AMap.GeometryUtil.ringArea(path));
  }
}


function reset() {
  map.remove(markers);
  map.remove(rectangle);
  markers = [];
  startPoint.value = null;
  endPoint.value = null;
  rectangle = null;
  area.value = null;
}

onUnmounted(() => {
  map?.destroy();
});
</script>



<style scoped>
#missionMapContainer {
  width: 100%;
  height: 800px;
}

.map-control {
  position: absolute;
  background: #fff;
  padding: 10px 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  font-size: 14px;
  z-index: 1000;
}

.map-control.top-right {
  top: 60px;
  right: 60px;
  width: 300px;
  text-align: center;
  /* 内容水平居中 */
}

.map-control.bottom-right {
  bottom: 120px;
  right: 60px;
  width: 200px;
}

.vertical-buttons {
  display: flex;
  flex-direction: column;
  /* 垂直排列 */
  gap: 10px;
  /* 按钮间距 */
}

#panel {
  position: absolute;
  background-color: white;
  overflow-y: auto;
  top: 220px;
  right: 60px;
  width: 300px;
}
</style>
