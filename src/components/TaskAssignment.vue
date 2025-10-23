<template>
  <div class="mission-container">
    <div class="content">
      <form @submit.prevent="goToNextStep">
        <!-- 任务名称 -->
        <div class="form-section horizontal-layout">
          <div class="form-group">
            <div class="label-container">
              <label for="taskName">任务名称</label>
            </div>
            <div class="input-container">
              <input 
                type="text" 
                id="taskName" 
                v-model="formData.taskName" 
                placeholder="请输入任务名称"
                maxlength="10"
                @input="validateTaskName"
              >
              <div class="char-count">{{ formData.taskName.length }}/10</div>
              <div class="hint">名称在十个字之内</div>
              <div class="error" v-if="errors.taskName">{{ errors.taskName }}</div>
            </div>
          </div>
        </div>
        
        <!-- 任务类型 -->
        <div class="form-section horizontal-layout">
          <div class="form-group">
            <div class="label-container">
              <label for="taskType">任务类型</label>
            </div>
            <div class="input-container">
              <select id="taskType" v-model="formData.taskType">
                <option disabled value="">请选择任务类型</option>
                <option value="fire">火情监测</option>
                <option value="assessment">灾后评估</option>
              </select>
              <div class="hint">请选择任务类型</div>
              <div class="error" v-if="errors.taskType">{{ errors.taskType }}</div>
            </div>
          </div>
        </div>
        
        <!-- 火情监测特定设置 -->
        <template v-if="formData.taskType === 'fire'">
          <!-- 任务设置 -->
          <div class="form-section horizontal-layout">
            <div class="form-group">
              <div class="label-container">
                <label for="taskMode">任务模式</label>
              </div>
              <div class="input-container">
                <select id="taskMode" v-model="formData.taskMode">
                  <option value="auto">自动任务</option>
                  <option value="manual">手动任务</option>
                </select>
              </div>
            </div>
          </div>
          
          <!-- 手动任务执行方式 -->
          <div class="form-section horizontal-layout" v-if="formData.taskMode === 'manual'">
            <div class="form-group">
              <div class="label-container">
                <label for="executionType">执行方式</label>
              </div>
              <div class="input-container">
                <select id="executionType" v-model="formData.executionType">
                  <option value="immediate">立即执行</option>
                  <option value="scheduled">定时执行</option>
                </select>
                <div class="hint">选择任务执行方式</div>
              </div>
            </div>
          </div>

          <!-- 定时执行时间选择 -->
          <div class="form-section horizontal-layout" v-if="formData.taskMode === 'manual' && formData.executionType === 'scheduled'">
            <div class="form-group">
              <div class="label-container">
                <label for="scheduledTime">定时执行时间</label>
              </div>
              <div class="input-container">
                <input 
                  type="datetime-local" 
                  id="scheduledTime" 
                  class="datetime-input"
                  v-model="formData.scheduledTime"
                  :min="minDateTime"
                  @change="fetchDroneAvailability"
                >
                <div class="hint">选择定时执行的具体日期和时间</div>
              </div>
            </div>
          </div>
          
          <!-- 任务周期设置 (仅自动任务显示) -->
          <div class="form-section horizontal-layout" v-if="formData.taskMode === 'auto'">
            <div class="form-group">
              <div class="label-container">
                <label for="taskCycle">任务周期</label>
              </div>
              <div class="input-container">
                <select id="taskCycle" v-model="formData.taskCycle">
                  <option value="daily">每日循环</option>
                  <option value="weekly">每周循环</option>
                </select>
                <div class="hint">选择任务执行周期</div>
              </div>
            </div>
          </div>

          <!-- 开始执行日期 (仅自动任务显示) -->
          <div class="form-section horizontal-layout" v-if="formData.taskMode === 'auto'">
            <div class="form-group">
              <div class="label-container">
                <label for="startDate">开始执行日期</label>
              </div>
              <div class="input-container">
                <input 
                  type="date" 
                  id="startDate" 
                  v-model="formData.startDate"
                  :min="minDate"
                  @change="fetchDroneAvailability"
                >
                <div class="hint">选择任务开始执行的日期</div>
                <div class="error" v-if="errors.startDate">{{ errors.startDate }}</div>
              </div>
            </div>
          </div>

          <!-- 每日循环时间选择 (仅自动任务显示) -->
          <div class="form-section horizontal-layout" v-if="formData.taskMode === 'auto' && formData.taskCycle === 'daily'">
            <div class="form-group">
              <div class="label-container">
                <label for="dailyTime">每日执行时间</label>
              </div>
              <div class="input-container">
                <input 
                  type="time" 
                  id="dailyTime" 
                  v-model="formData.dailyTime"
                  @change="fetchDroneAvailability"
                >
                <div class="hint">选择每日执行的具体时间</div>
              </div>
            </div>
          </div>

          <!-- 每周循环时间选择 (仅自动任务显示) -->
          <template v-if="formData.taskMode === 'auto' && formData.taskCycle === 'weekly'">
            <div class="form-section horizontal-layout">
              <div class="form-group">
                <div class="label-container">
                  <label>选择星期几</label>
                </div>
                <div class="input-container">
                  <div class="weekday-selector">
                    <button 
                      type="button" 
                      v-for="(day, index) in weekdays" 
                      :key="index"
                      :class="['weekday-btn', { selected: formData.weeklyDay === day.value }]"
                      @click="formData.weeklyDay = day.value; fetchDroneAvailability()"
                    >
                      {{ day.label }}
                    </button>
                  </div>
                  <div class="hint">选择每周执行的日期</div>
                  <div class="error" v-if="errors.weeklyDay">{{ errors.weeklyDay }}</div>
                </div>
              </div>
            </div>

            <div class="form-section horizontal-layout">
              <div class="form-group">
                <div class="label-container">
                  <label for="weeklyTime">每周执行时间</label>
                </div>
                <div class="input-container">
                  <input 
                    type="time" 
                    id="weeklyTime" 
                    v-model="formData.weeklyTime"
                    @change="fetchDroneAvailability"
                  >
                  <div class="hint">选择每周执行的具体时间</div>
                </div>
              </div>
            </div>
          </template>
        </template>
        
        <!-- 灾后评估特定设置 -->
        <template v-else-if="formData.taskType === 'assessment'">
          <!-- 评估参数 -->
          <div class="form-section horizontal-layout">
            <div class="form-group">
              <div class="label-container">
                <label>评估参数</label>
              </div>
              <div class="input-container">
                <div class="checkbox-group">
                  <div class="checkbox-item">
                    <input 
                      type="checkbox" 
                      id="buildingDamage" 
                      value="buildingDamage" 
                      v-model="formData.assessmentParams"
                    >
                    <label for="buildingDamage">建筑损毁</label>
                  </div>
                  <div class="checkbox-item">
                    <input 
                      type="checkbox" 
                      id="casualties" 
                      value="casualties" 
                      v-model="formData.assessmentParams"
                    >
                    <label for="casualties">人员伤亡</label>
                  </div>
                  <div class="checkbox-item">
                    <input 
                      type="checkbox" 
                      id="economicLoss" 
                      value="economicLoss" 
                      v-model="formData.assessmentParams"
                    >
                    <label for="economicLoss">经济损失</label>
                  </div>
                  <div class="checkbox-item">
                    <input 
                      type="checkbox" 
                      id="environmentImpact" 
                      value="environmentImpact" 
                      v-model="formData.assessmentParams"
                    >
                    <label for="environmentImpact">环境影响</label>
                  </div>
                </div>
                <div class="hint">选择需要评估的参数</div>
                <div class="error" v-if="errors.assessmentParams">{{ errors.assessmentParams }}</div>
              </div>
            </div>
          </div>
        </template>
        
        <!-- 无人机设置 (所有任务类型都显示) -->
        <div class="form-section horizontal-layout" v-if="showDroneSelection">
          <div class="form-group">
            <div class="label-container">
              <label>选择无人机（{{ selectedDronesCount }} 台已选）</label>
            </div>
            <div class="input-container">
              <div class="loading-indicator" v-if="loadingDrones">
                <i class="fas fa-spinner fa-spin"></i> 正在获取无人机可用状态...
              </div>
              <div class="checkbox-group" v-else>
                <div 
                  v-for="drone in drones" 
                  :key="drone.id"
                  :class="['checkbox-item', { disabled: !drone.available }]"
                >
                  <input 
                    type="checkbox" 
                    :id="'drone' + drone.id" 
                    :value="drone.id" 
                    v-model="formData.selectedDrones"
                    :disabled="!drone.available"
                  >
                  <label :for="'drone' + drone.id">
                    {{ drone.name }}
                    <span 
                      :class="['status-indicator', drone.available ? 'status-active' : 'status-inactive']"
                      :title="drone.available ? '可用' : '不可用'"
                    ></span>
                  </label>
                </div>
              </div>
              <div class="hint" v-if="!loadingDrones">根据您选择的时间显示无人机可用状态</div>
              <div class="error" v-if="errors.selectedDrones">{{ errors.selectedDrones }}</div>
            </div>
          </div>
        </div>
        
        <!-- 操作按钮 -->
        <div class="actions">
          <button type="button" class="btn-reset" @click="resetForm">重置</button>
          <button type="submit" class="btn-submit">下一步</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ERouterName } from '../types/enum'

export default {
  name: 'MissionView',
  setup() {
    const router = useRouter()
    
    // 获取当前日期时间作为最小可选时间
    const getCurrentDateTime = () => {
      const now = new Date();
      // 转换为本地时间字符串，格式为 YYYY-MM-DDTHH:MM
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };
    
    // 获取当前日期作为最小可选日期
    const getCurrentDate = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    };
    
    // 表单数据
    const formData = reactive({
      taskName: '',
      taskType: '',
      selectedDrones: [],
      taskMode: 'auto',
      executionType: 'immediate',
      scheduledTime: getCurrentDateTime(),
      taskCycle: 'daily',
      startDate: getCurrentDate(),
      dailyTime: '09:00',
      weeklyDay: '',
      weeklyTime: '09:00',
      assessmentParams: []
    });
    
    // 最小日期时间（当前时间）
    const minDateTime = ref(getCurrentDateTime());
    // 最小日期（当前日期）
    const minDate = ref(getCurrentDate());
    
    // 错误信息
    const errors = reactive({
      taskName: '',
      taskType: '',
      selectedDrones: '',
      assessmentParams: '',
      weeklyDay: '',
      startDate: ''
    });
    
    // 无人机数据（初始为空，等待获取）
    const drones = ref([]);
    const loadingDrones = ref(false);
    
    // 星期选项
    const weekdays = ref([
      { value: 'monday', label: '周一' },
      { value: 'tuesday', label: '周二' },
      { value: 'wednesday', label: '周三' },
      { value: 'thursday', label: '周四' },
      { value: 'friday', label: '周五' },
      { value: 'saturday', label: '周六' },
      { value: 'sunday', label: '周日' }
    ]);
    
    // 计算已选择的无人机数量
    const selectedDronesCount = computed(() => {
      return formData.selectedDrones.length;
    });
    
    // 计算是否显示无人机选择部分
    const showDroneSelection = computed(() => {
      // 对于火情监测任务，只有当时间信息已设置时才显示无人机选择
      if (formData.taskType === 'fire') {
        if (formData.taskMode === 'manual') {
          if (formData.executionType === 'immediate') {
            return true; // 立即执行，不需要额外时间信息
          } else if (formData.executionType === 'scheduled') {
            return !!formData.scheduledTime; // 需要已选择定时执行时间
          }
        } else if (formData.taskMode === 'auto') {
          if (formData.taskCycle === 'daily') {
            return !!formData.startDate && !!formData.dailyTime; // 需要开始日期和每日时间
          } else if (formData.taskCycle === 'weekly') {
            return !!formData.startDate && !!formData.weeklyDay && !!formData.weeklyTime; // 需要开始日期、星期和时间
          }
        }
        return false;
      }
      // 对于灾后评估任务，直接显示无人机选择
      return formData.taskType === 'assessment';
    });
    
    // 验证任务名称
    const validateTaskName = () => {
      if (formData.taskName.length > 10) {
        errors.taskName = '任务名称不能超过10个字符';
      } else {
        errors.taskName = '';
      }
    };
    
    // 获取无人机可用状态
    const fetchDroneAvailability = async () => {
      // 如果不显示无人机选择部分，则不获取数据
      if (!showDroneSelection.value) return;
      
      loadingDrones.value = true;
      
      try {
        // 构建请求参数
        let params = {};
        
        if (formData.taskType === 'fire') {
          if (formData.taskMode === 'manual') {
            if (formData.executionType === 'scheduled') {
              params = {
                executionTime: formData.scheduledTime
              };
            } else {
              // 立即执行，使用当前时间
              params = {
                executionTime: getCurrentDateTime()
              };
            }
          } else if (formData.taskMode === 'auto') {
            // 构建重复任务的时间参数
            params = {
              startDate: formData.startDate,
              taskCycle: formData.taskCycle
            };
            
            if (formData.taskCycle === 'daily') {
              params.dailyTime = formData.dailyTime;
            } else if (formData.taskCycle === 'weekly') {
              params.weeklyDay = formData.weeklyDay;
              params.weeklyTime = formData.weeklyTime;
            }
          }
        } else if (formData.taskType === 'assessment') {
          // 灾后评估任务，使用当前时间
          params = {
            executionTime: getCurrentDateTime()
          };
        }
        
        // 模拟API调用
        console.log('获取无人机可用状态，参数:', params);
        
        // 模拟API响应延迟
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 模拟API响应数据
        // 使用从API返回的数据
        drones.value = [
          { id: 1, name: '无人机 #1', available: Math.random() > 0.3 },
          { id: 2, name: '无人机 #2', available: Math.random() > 0.3 },
          { id: 3, name: '无人机 #3', available: Math.random() > 0.3 },
          { id: 4, name: '无人机 #4', available: Math.random() > 0.3 }
        ];
        
        // 清除已选择但不可用的无人机
        formData.selectedDrones = formData.selectedDrones.filter(id => {
          const drone = drones.value.find(d => d.id === id);
          return drone && drone.available;
        });
        
      } catch (error) {
        console.error('获取无人机状态失败:', error);
        //显示错误消息
      } finally {
        loadingDrones.value = false;
      }
    };
    
    // 监听任务类型变化
    watch(() => formData.taskType, (newVal) => {
      if (newVal) {
        // 重置无人机选择
        formData.selectedDrones = [];
        // 获取无人机可用状态
        fetchDroneAvailability();
      }
    });
    
    // 监听手动任务执行方式变化
    watch(() => formData.executionType, (newVal) => {
      if (newVal === 'immediate') {
        // 立即执行，直接获取无人机状态
        fetchDroneAvailability();
      }
    });
    
    // 表单验证
    const validateForm = () => {
      let isValid = true;
      
      // 验证任务名称
      if (!formData.taskName.trim()) {
        errors.taskName = '请输入任务名称';
        isValid = false;
      } else if (formData.taskName.length > 10) {
        errors.taskName = '任务名称不能超过10个字符';
        isValid = false;
      } else {
        errors.taskName = '';
      }
      
      // 验证任务类型
      if (!formData.taskType) {
        errors.taskType = '请选择任务类型';
        isValid = false;
      } else {
        errors.taskType = '';
      }
      
      // 验证无人机选择
      if (formData.selectedDrones.length === 0) {
        errors.selectedDrones = '请至少选择一台无人机';
        isValid = false;
      } else {
        errors.selectedDrones = '';
      }
      
      // 验证开始执行日期（仅对自动任务）
      if (formData.taskMode === 'auto' && !formData.startDate) {
        errors.startDate = '请选择开始执行日期';
        isValid = false;
      } else {
        errors.startDate = '';
      }
      
      // 验证每周任务日期选择
      if (formData.taskMode === 'auto' && formData.taskCycle === 'weekly' && !formData.weeklyDay) {
        errors.weeklyDay = '请选择每周执行的日期';
        isValid = false;
      } else {
        errors.weeklyDay = '';
      }
      
      // 验证评估参数（仅对灾后评估任务）
      if (formData.taskType === 'assessment' && formData.assessmentParams.length === 0) {
        errors.assessmentParams = '请至少选择一个评估参数';
        isValid = false;
      } else {
        errors.assessmentParams = '';
      }
      
      return isValid;
    };
    
    // 跳转到下一步
    const goToNextStep = () => {
      console.log('goToNextStep 被调用');
      
      if (validateForm()) {
        console.log('表单验证通过');
        // 将表单数据存储在sessionStorage中以便在MissionForm中使用
        sessionStorage.setItem('missionFormData', JSON.stringify(formData));
        
        console.log('准备跳转到:', ERouterName.WAYLINE);
        
        // 跳转到MissionForm页面
        router.push({ name: ERouterName.WAYLINE });
      } else {
        console.log('表单验证失败');
      }
    };
    
    // 重置表单
    const resetForm = () => {
      formData.taskName = '';
      formData.taskType = '';
      formData.selectedDrones = [];
      formData.taskMode = 'auto';
      formData.executionType = 'immediate';
      formData.scheduledTime = getCurrentDateTime();
      formData.taskCycle = 'daily';
      formData.startDate = getCurrentDate();
      formData.dailyTime = '09:00';
      formData.weeklyDay = '';
      formData.weeklyTime = '09:00';
      formData.assessmentParams = [];
      
      // 清空错误信息
      errors.taskName = '';
      errors.taskType = '';
      errors.selectedDrones = '';
      errors.assessmentParams = '';
      errors.weeklyDay = '';
      errors.startDate = '';
      
      // 重置无人机列表
      drones.value = [];
    };
    
    return {
      formData,
      errors,
      drones,
      weekdays,
      minDateTime,
      minDate,
      loadingDrones,
      selectedDronesCount,
      showDroneSelection,
      validateTaskName,
      fetchDroneAvailability,
      goToNextStep,
      resetForm
    };
  }
}
</script>

<style scoped>
.mission-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  margin: 20px;
}

.content {
  padding: 30px;
}

.form-section {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eaeaea;
}

.form-section:last-child {
  border-bottom: none;
}

.horizontal-layout .form-group {
  display: flex;
  align-items: flex-start;
  gap: 20px;
}

.label-container {
  flex: 0 0 150px;
  text-align: right;
  padding-top: 12px;
}

.label-container label {
  margin-bottom: 0;
  font-weight: 500;
  color: #4a5568;
}

.input-container {
  flex: 1;
}

input[type="text"], 
select, 
input[type="time"],
input[type="date"] {
  width: 100%;
  max-width: 400px;
  padding: 12px 15px;
  border: 1px solid #cbd5e0;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.3s;
}

input[type="text"]:focus, 
select:focus, 
input[type="time"]:focus,
input[type="date"]:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.2);
}

.hint {
  font-size: 14px;
  color: #718096;
  margin-top: 5px;
}

.error {
  color: #e53e3e;
  font-size: 14px;
  margin-top: 5px;
}

.checkbox-group {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.3s;
}

.checkbox-item:hover {
  background-color: #f7fafc;
}

.checkbox-item.disabled {
  opacity: 0.5;
  background-color: #f1f1f1;
  cursor: not-allowed;
}

.checkbox-item input[type="checkbox"] {
  margin-right: 10px;
  width: 18px;
  height: 18px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 30px;
}

button {
  padding: 12px 25px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-submit {
  background-color: #4299e1;
  color: white;
}

.btn-submit:hover {
  background-color: #3182ce;
}

.btn-reset {
  background-color: #e2e8f0;
  color: #4a5568;
}

.btn-reset:hover {
  background-color: #cbd5e0;
}

.status-indicator {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-left: 8px;
}

.status-active {
  background-color: #48bb78;
}

.status-inactive {
  background-color: #e53e3e;
}

.char-count {
  text-align: right;
  font-size: 14px;
  color: #718096;
  margin-top: 5px;
}

.weekday-selector {
  display: flex;
  gap: 10px;
  margin-top: 10px;
  flex-wrap: wrap;
}

.weekday-btn {
  padding: 8px 12px;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.weekday-btn.selected {
  background-color: #4299e1;
  color: white;
  border-color: #4299e1;
}

.datetime-input {
  width: 100%;
  max-width: 400px;
  padding: 12px 15px;
  border: 1px solid #cbd5e0;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.3s;
  font-family: inherit;
}

.datetime-input:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.2);
}

.loading-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px;
  background-color: #f7fafc;
  border-radius: 8px;
  color: #4a5568;
}

@media (max-width: 768px) {
  .horizontal-layout .form-group {
    flex-direction: column;
    gap: 10px;
  }
  
  .label-container {
    flex: 1;
    text-align: left;
    padding-top: 0;
  }
  
  .checkbox-group {
    grid-template-columns: 1fr;
  }
  
  .mission-container {
    margin: 10px;
  }
  
  .weekday-selector {
    justify-content: center;
  }
}
</style>