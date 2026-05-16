/* eslint-disable no-console,@typescript-eslint/no-explicit-any */

'use client';

import { KeyRound, LogOut, Settings, Shield, User, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { getAuthInfoFromBrowserCookie } from '@/lib/auth';
import {
  DOUBAN_PROXY_PRESETS,
  DoubanProxyType,
  IMAGE_PROXY_PRESETS,
  ImageProxyType,
} from '@/lib/utils';
import { checkForUpdates, CURRENT_VERSION, UpdateStatus } from '@/lib/version';

interface AuthInfo {
  username?: string;
  role?: 'owner' | 'admin' | 'user';
}

export const UserMenu: React.FC = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [authInfo, setAuthInfo] = useState<AuthInfo | null>(null);
  const [storageType, setStorageType] = useState<string>('localstorage');
  const [mounted, setMounted] = useState(false);

  // 设置相关状态
  const [defaultAggregateSearch, setDefaultAggregateSearch] = useState(true);
  const [doubanProxyType, setDoubanProxyType] =
    useState<DoubanProxyType>('direct');
  const [doubanProxyCustomUrl, setDoubanProxyCustomUrl] = useState('');
  const [imageProxyType, setImageProxyType] =
    useState<ImageProxyType>('server');
  const [imageProxyCustomUrl, setImageProxyCustomUrl] = useState('');
  const [enableOptimization, setEnableOptimization] = useState(true);

  // 修改密码相关状态
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // 版本检查相关状态
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  // 确保组件已挂载
  useEffect(() => {
    setMounted(true);
  }, []);

  // 获取认证信息和存储类型
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const auth = getAuthInfoFromBrowserCookie();
      setAuthInfo(auth);

      const type =
        (window as any).RUNTIME_CONFIG?.STORAGE_TYPE || 'localstorage';
      setStorageType(type);
    }
  }, []);

  // 从 localStorage 读取设置
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedAggregateSearch = localStorage.getItem(
        'defaultAggregateSearch'
      );
      if (savedAggregateSearch !== null) {
        setDefaultAggregateSearch(JSON.parse(savedAggregateSearch));
      }

      const savedDoubanType = localStorage.getItem(
        'doubanProxyType'
      ) as DoubanProxyType | null;
      if (savedDoubanType && savedDoubanType in DOUBAN_PROXY_PRESETS) {
        setDoubanProxyType(savedDoubanType);
      }

      const savedDoubanCustomUrl = localStorage.getItem('doubanProxyCustomUrl');
      if (savedDoubanCustomUrl !== null) {
        setDoubanProxyCustomUrl(savedDoubanCustomUrl);
      }

      const savedImageType = localStorage.getItem(
        'imageProxyType'
      ) as ImageProxyType | null;
      if (savedImageType && savedImageType in IMAGE_PROXY_PRESETS) {
        setImageProxyType(savedImageType);
      }

      const savedImageCustomUrl = localStorage.getItem('imageProxyCustomUrl');
      if (savedImageCustomUrl !== null) {
        setImageProxyCustomUrl(savedImageCustomUrl);
      }

      const savedEnableOptimization =
        localStorage.getItem('enableOptimization');
      if (savedEnableOptimization !== null) {
        setEnableOptimization(JSON.parse(savedEnableOptimization));
      }
    }
  }, []);

  // 版本检查
  useEffect(() => {
    const checkUpdate = async () => {
      try {
        const status = await checkForUpdates();
        setUpdateStatus(status);
      } catch (error) {
        console.warn('版本检查失败:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkUpdate();
  }, []);

  const handleMenuClick = () => {
    setIsOpen(!isOpen);
  };

  const handleCloseMenu = () => {
    setIsOpen(false);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('注销请求失败:', error);
    }
    window.location.href = '/';
  };

  const handleAdminPanel = () => {
    router.push('/admin');
  };

  const handleChangePassword = () => {
    setIsOpen(false);
    setIsChangePasswordOpen(true);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
  };

  const handleCloseChangePassword = () => {
    setIsChangePasswordOpen(false);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
  };

  const handleSubmitChangePassword = async () => {
    setPasswordError('');

    // 验证密码
    if (!newPassword) {
      setPasswordError('新密码不得为空');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('两次输入的密码不一致');
      return;
    }

    setPasswordLoading(true);

    try {
      const response = await fetch('/api/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setPasswordError(data.error || '修改密码失败');
        return;
      }

      // 修改成功，关闭弹窗并登出
      setIsChangePasswordOpen(false);
      await handleLogout();
    } catch (error) {
      setPasswordError('网络错误，请稍后重试');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSettings = () => {
    setIsOpen(false);
    setIsSettingsOpen(true);
  };

  const handleCloseSettings = () => {
    setIsSettingsOpen(false);
  };

  // 设置相关的处理函数
  const handleAggregateToggle = (value: boolean) => {
    setDefaultAggregateSearch(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('defaultAggregateSearch', JSON.stringify(value));
    }
  };

  const handleDoubanProxyTypeChange = (type: DoubanProxyType) => {
    setDoubanProxyType(type);
    if (typeof window !== 'undefined') {
      localStorage.setItem('doubanProxyType', type);
    }
  };

  const handleDoubanProxyCustomUrlChange = (value: string) => {
    setDoubanProxyCustomUrl(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('doubanProxyCustomUrl', value);
    }
  };

  const handleImageProxyTypeChange = (type: ImageProxyType) => {
    setImageProxyType(type);
    if (typeof window !== 'undefined') {
      localStorage.setItem('imageProxyType', type);
    }
  };

  const handleImageProxyCustomUrlChange = (value: string) => {
    setImageProxyCustomUrl(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('imageProxyCustomUrl', value);
    }
  };

  const handleOptimizationToggle = (value: boolean) => {
    setEnableOptimization(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('enableOptimization', JSON.stringify(value));
    }
  };

  const handleResetSettings = () => {
    setDefaultAggregateSearch(true);
    setEnableOptimization(true);
    setDoubanProxyType('direct');
    setDoubanProxyCustomUrl('');
    setImageProxyType('server');
    setImageProxyCustomUrl('');

    if (typeof window !== 'undefined') {
      localStorage.setItem('defaultAggregateSearch', JSON.stringify(true));
      localStorage.setItem('enableOptimization', JSON.stringify(true));
      localStorage.setItem('doubanProxyType', 'direct');
      localStorage.removeItem('doubanProxyCustomUrl');
      localStorage.setItem('imageProxyType', 'server');
      localStorage.removeItem('imageProxyCustomUrl');
    }
  };

  // 检查是否显示管理面板按钮
  const showAdminPanel =
    authInfo?.role === 'owner' || authInfo?.role === 'admin';

  // 检查是否显示修改密码按钮
  const showChangePassword =
    authInfo?.role !== 'owner' && storageType !== 'localstorage';

  // 角色中文映射
  const getRoleText = (role?: string) => {
    switch (role) {
      case 'owner':
        return '站长';
      case 'admin':
        return '管理员';
      case 'user':
        return '用户';
      default:
        return '';
    }
  };

  // 菜单面板内容
  const menuPanel = (
    <>
      {/* 背景遮罩 - 普通菜单无需模糊 */}
      <div
        className='fixed inset-0 bg-transparent z-[1000]'
        onClick={handleCloseMenu}
      />

      {/* 菜单面板 */}
      <div className='fixed top-14 right-4 w-56 bg-white dark:bg-gray-900 rounded-lg shadow-xl z-[1001] border border-gray-200/50 dark:border-gray-700/50 overflow-hidden select-none'>
        {/* 用户信息区域 */}
        <div className='px-3 py-2.5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800 dark:to-gray-800/50'>
          <div className='space-y-1'>
            <div className='flex items-center justify-between'>
              <span className='text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                当前用户
              </span>
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                  (authInfo?.role || 'user') === 'owner'
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                    : (authInfo?.role || 'user') === 'admin'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                }`}
              >
                {getRoleText(authInfo?.role || 'user')}
              </span>
            </div>
            <div className='flex items-center justify-between'>
              <div className='font-semibold text-gray-900 dark:text-gray-100 text-sm truncate'>
                {authInfo?.username || 'default'}
              </div>
              <div className='text-[10px] text-gray-400 dark:text-gray-500'>
                数据存储：
                {storageType === 'localstorage' ? '本地' : storageType}
              </div>
            </div>
          </div>
        </div>

        {/* 菜单项 */}
        <div className='py-1'>
          {/* 设置按钮 */}
          <button
            onClick={handleSettings}
            className='w-full px-3 py-2 text-left flex items-center gap-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm'
          >
            <Settings className='w-4 h-4 text-gray-500 dark:text-gray-400' />
            <span className='font-medium'>设置</span>
          </button>

          {/* 管理面板按钮 */}
          {showAdminPanel && (
            <button
              onClick={handleAdminPanel}
              className='w-full px-3 py-2 text-left flex items-center gap-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm'
            >
              <Shield className='w-4 h-4 text-gray-500 dark:text-gray-400' />
              <span className='font-medium'>管理面板</span>
            </button>
          )}

          {/* 修改密码按钮 */}
          {showChangePassword && (
            <button
              onClick={handleChangePassword}
              className='w-full px-3 py-2 text-left flex items-center gap-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm'
            >
              <KeyRound className='w-4 h-4 text-gray-500 dark:text-gray-400' />
              <span className='font-medium'>修改密码</span>
            </button>
          )}

          {/* 分割线 */}
          <div className='my-1 border-t border-gray-200 dark:border-gray-700'></div>

          {/* 登出按钮 */}
          <button
            onClick={handleLogout}
            className='w-full px-3 py-2 text-left flex items-center gap-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm'
          >
            <LogOut className='w-4 h-4' />
            <span className='font-medium'>登出</span>
          </button>

          {/* 分割线 */}
          <div className='my-1 border-t border-gray-200 dark:border-gray-700'></div>

          {/* 版本信息 */}
          <button
            onClick={() =>
              window.open('https://github.com/LunaTechLab/MoonTV', '_blank')
            }
            className='w-full px-3 py-2 text-center flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-xs'
          >
            <div className='flex items-center gap-1'>
              <span className='font-mono'>v{CURRENT_VERSION}</span>
              {!isChecking &&
                updateStatus &&
                updateStatus !== UpdateStatus.FETCH_FAILED && (
                  <div
                    className={`w-2 h-2 rounded-full -translate-y-2 ${
                      updateStatus === UpdateStatus.HAS_UPDATE
                        ? 'bg-yellow-500'
                        : updateStatus === UpdateStatus.NO_UPDATE
                        ? 'bg-blue-400'
                        : ''
                    }`}
                  ></div>
                )}
            </div>
          </button>
        </div>
      </div>
    </>
  );

  // 设置面板内容
  const settingsPanel = (
    <>
      {/* 背景遮罩 */}
      <div
        className='fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000]'
        onClick={handleCloseSettings}
      />

      {/* 设置面板 */}
      <div className='fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-xl z-[1001] p-6'>
        {/* 标题栏 */}
        <div className='flex items-center justify-between mb-6'>
          <div className='flex items-center gap-3'>
            <h3 className='text-xl font-bold text-gray-800 dark:text-gray-200'>
              本地设置
            </h3>
            <button
              onClick={handleResetSettings}
              className='px-2 py-1 text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border border-red-200 hover:border-red-300 dark:border-red-800 dark:hover:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors'
              title='重置为默认设置'
            >
              重置
            </button>
          </div>
          <button
            onClick={handleCloseSettings}
            className='w-8 h-8 p-1 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'
            aria-label='Close'
          >
            <X className='w-full h-full' />
          </button>
        </div>

        {/* 设置项 */}
        <div className='space-y-6'>
          {/* 默认聚合搜索结果 */}
          <div className='flex items-center justify-between'>
            <div>
              <h4 className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                默认聚合搜索结果
              </h4>
              <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                搜索时默认按标题和年份聚合显示结果
              </p>
            </div>
            <label className='flex items-center cursor-pointer'>
              <div className='relative'>
                <input
                  type='checkbox'
                  className='sr-only peer'
                  checked={defaultAggregateSearch}
                  onChange={(e) => handleAggregateToggle(e.target.checked)}
                />
                <div className='w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-blue-500 transition-colors dark:bg-gray-600'></div>
                <div className='absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5'></div>
              </div>
            </label>
          </div>

          {/* 优选和测速 */}
          <div className='flex items-center justify-between'>
            <div>
              <h4 className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                启用优选和测速
              </h4>
              <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                如出现播放器劫持问题可关闭
              </p>
            </div>
            <label className='flex items-center cursor-pointer'>
              <div className='relative'>
                <input
                  type='checkbox'
                  className='sr-only peer'
                  checked={enableOptimization}
                  onChange={(e) => handleOptimizationToggle(e.target.checked)}
                />
                <div className='w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-blue-500 transition-colors dark:bg-gray-600'></div>
                <div className='absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5'></div>
              </div>
            </label>
          </div>

          {/* 分割线 */}
          <div className='border-t border-gray-200 dark:border-gray-700'></div>

          {/* 分割线 */}
          <div className='border-t border-gray-200 dark:border-gray-700'></div>

          {/* 豆瓣数据代理 */}
          <div>
            <h4 className='text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
              豆瓣数据代理
            </h4>
            <p className='text-xs text-gray-500 dark:text-gray-400 mb-3'>
              选择豆瓣数据的获取方式
            </p>
            <div className='grid grid-cols-2 gap-2'>
              {(
                Object.entries(DOUBAN_PROXY_PRESETS) as [
                  DoubanProxyType,
                  { label: string; url: string }
                ][]
              ).map(([type, preset]) => (
                <button
                  key={type}
                  onClick={() => handleDoubanProxyTypeChange(type)}
                  className={`px-2 py-1.5 text-xs rounded-md border transition-colors text-left ${
                    doubanProxyType === type
                      ? 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/20 dark:border-blue-600 dark:text-blue-400'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            {doubanProxyType === 'custom' && (
              <input
                type='text'
                className='mt-2 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400'
                placeholder='输入自定义代理 URL，如 https://proxy.example.com/fetch?url='
                value={doubanProxyCustomUrl}
                onChange={(e) =>
                  handleDoubanProxyCustomUrlChange(e.target.value)
                }
              />
            )}
          </div>

          {/* 分割线 */}
          <div className='border-t border-gray-200 dark:border-gray-700'></div>

          {/* 豆瓣图片代理 */}
          <div>
            <h4 className='text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
              豆瓣图片代理
            </h4>
            <p className='text-xs text-gray-500 dark:text-gray-400 mb-3'>
              选择豆瓣封面的加载方式（与数据代理独立配置）
            </p>
            <div className='grid grid-cols-2 gap-2'>
              {(
                Object.entries(IMAGE_PROXY_PRESETS) as [
                  ImageProxyType,
                  { label: string; url: string }
                ][]
              ).map(([type, preset]) => (
                <button
                  key={type}
                  onClick={() => handleImageProxyTypeChange(type)}
                  className={`px-2 py-1.5 text-xs rounded-md border transition-colors text-left ${
                    imageProxyType === type
                      ? 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/20 dark:border-blue-600 dark:text-blue-400'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            {imageProxyType === 'custom' && (
              <input
                type='text'
                className='mt-2 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400'
                placeholder='输入自定义图片代理 URL，如 https://imageproxy.example.com/?url='
                value={imageProxyCustomUrl}
                onChange={(e) =>
                  handleImageProxyCustomUrlChange(e.target.value)
                }
              />
            )}
          </div>
        </div>

        {/* 底部说明 */}
        <div className='mt-6 pt-4 border-t border-gray-200 dark:border-gray-700'>
          <p className='text-xs text-gray-500 dark:text-gray-400 text-center'>
            这些设置保存在本地浏览器中
          </p>
        </div>
      </div>
    </>
  );

  // 修改密码面板内容
  const changePasswordPanel = (
    <>
      {/* 背景遮罩 */}
      <div
        className='fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000]'
        onClick={handleCloseChangePassword}
      />

      {/* 修改密码面板 */}
      <div className='fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-xl z-[1001] p-6'>
        {/* 标题栏 */}
        <div className='flex items-center justify-between mb-6'>
          <h3 className='text-xl font-bold text-gray-800 dark:text-gray-200'>
            修改密码
          </h3>
          <button
            onClick={handleCloseChangePassword}
            className='w-8 h-8 p-1 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'
            aria-label='Close'
          >
            <X className='w-full h-full' />
          </button>
        </div>

        {/* 表单 */}
        <div className='space-y-4'>
          {/* 新密码输入 */}
          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
              新密码
            </label>
            <input
              type='password'
              className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400'
              placeholder='请输入新密码'
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={passwordLoading}
            />
          </div>

          {/* 确认密码输入 */}
          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
              确认密码
            </label>
            <input
              type='password'
              className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400'
              placeholder='请再次输入新密码'
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={passwordLoading}
            />
          </div>

          {/* 错误信息 */}
          {passwordError && (
            <div className='text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-md border border-red-200 dark:border-red-800'>
              {passwordError}
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className='flex gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700'>
          <button
            onClick={handleCloseChangePassword}
            className='flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors'
            disabled={passwordLoading}
          >
            取消
          </button>
          <button
            onClick={handleSubmitChangePassword}
            className='flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            disabled={passwordLoading || !newPassword || !confirmPassword}
          >
            {passwordLoading ? '修改中...' : '确认修改'}
          </button>
        </div>

        {/* 底部说明 */}
        <div className='mt-4 pt-4 border-t border-gray-200 dark:border-gray-700'>
          <p className='text-xs text-gray-500 dark:text-gray-400 text-center'>
            修改密码后需要重新登录
          </p>
        </div>
      </div>
    </>
  );

  return (
    <>
      <div className='relative'>
        <button
          onClick={handleMenuClick}
          className='w-10 h-10 p-2 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200/50 dark:text-gray-300 dark:hover:bg-gray-700/50 transition-colors'
          aria-label='User Menu'
        >
          <User className='w-full h-full' />
        </button>
        {updateStatus === UpdateStatus.HAS_UPDATE && (
          <div className='absolute top-[2px] right-[2px] w-2 h-2 bg-yellow-500 rounded-full'></div>
        )}
      </div>

      {/* 使用 Portal 将菜单面板渲染到 document.body */}
      {isOpen && mounted && createPortal(menuPanel, document.body)}

      {/* 使用 Portal 将设置面板渲染到 document.body */}
      {isSettingsOpen && mounted && createPortal(settingsPanel, document.body)}

      {/* 使用 Portal 将修改密码面板渲染到 document.body */}
      {isChangePasswordOpen &&
        mounted &&
        createPortal(changePasswordPanel, document.body)}
    </>
  );
};
