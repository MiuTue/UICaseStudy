import React from 'react';
import { Sidebar, Menu, MenuItem, SubMenu } from 'react-pro-sidebar';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaTachometerAlt, FaList, FaPlusSquare, FaSignOutAlt, FaAngleLeft, FaAngleRight } from 'react-icons/fa';

const SideBar = ({ isCollapsed, setCollapsed }) => {
    const location = useLocation();
    const navigate = useNavigate();

    // Hàm để kiểm tra xem một link có active hay không
    const isActive = (path) => location.pathname === path;

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        // Sidebar được đặt trong một div có chiều cao 100vh và vị trí cố định
        <div style={{ display: 'flex', height: '100vh', position: 'fixed', top: 0, left: 0, zIndex: 1000, color: '#94a3b8' }}>
            <div className="absolute top-5 -right-3 z-50">
                <button onClick={() => setCollapsed(!isCollapsed)} className="bg-slate-700 hover:bg-primary-600 text-white w-7 h-7 rounded-full flex items-center justify-center transition-all">
                    {isCollapsed ? <FaAngleRight /> : <FaAngleLeft />}
                </button>
            </div>
            <Sidebar
                collapsed={isCollapsed}
                backgroundColor="rgba(30, 41, 59, 0.9)"
                rootStyles={{
                    borderRight: '1px solid #334155'
                }}
            >
                <div className="flex flex-col h-full">
                    {/* Phần Header của Sidebar */}
                    <div className="p-4 pt-6 mb-4 border-b border-slate-700">
                        <Link to="/user" className={`flex items-center gap-3 hover:opacity-80 transition ${isCollapsed ? 'justify-center' : ''}`}>
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-600 text-xl font-semibold text-white">
                                TAT
                            </div>
                            {!isCollapsed && (
                                <h1 className="text-lg font-semibold text-white">Case Study TAT</h1>
                            )}
                        </Link>
                    </div>

                    {/* Phần Menu chính */}
                    <div className="flex-grow">
                        <Menu
                            menuItemStyles={{
                                button: ({ active }) => ({
                                    color: active ? '#34d399' : '#94a3b8', // emerald-400 for active
                                    backgroundColor: active ? '#1e293b' : 'transparent',
                                    transition: 'all 0.2s ease-in-out',
                                    '&:hover': {
                                        background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0) 100%)',
                                        color: '#ffffff',
                                        borderLeft: '3px solid #10b981' // emerald-500
                                    },
                                }),
                            }}
                        >
                            <MenuItem active={isActive('/user')} icon={<FaTachometerAlt />} component={<Link to="/user" />}>
                                Trang Chính
                            </MenuItem>
                            <MenuItem active={isActive('/case-list')} icon={<FaList />} component={<Link to="/case-list" />}>
                                Danh sách Case
                            </MenuItem>
                            <MenuItem active={isActive('/case-input')} icon={<FaPlusSquare />} component={<Link to="/case-input" />}>
                                Nhập Case
                            </MenuItem>
                        </Menu>
                    </div>

                    {/* Phần Footer của Sidebar - Nút Đăng xuất */}
                    <div className="border-t border-slate-700 p-2">
                         <Menu menuItemStyles={{ button: { color: '#94a3b8', '&:hover': { background: 'linear-gradient(90deg, rgba(153, 27, 27, 0.3) 0%, rgba(153, 27, 27, 0) 100%)', color: '#fca5a5' } } }}>
                            <MenuItem icon={<FaSignOutAlt />} onClick={handleLogout}>
                                Đăng xuất
                            </MenuItem>
                        </Menu>
                    </div>
                </div>
            </Sidebar>
        </div>
    );
};

export default SideBar;