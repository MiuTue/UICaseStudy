import React, { useState } from "react";
import { Link } from "react-router-dom";
import NavBar from "../../components/NavBar";
import Footer from "../../components/Footer";

export default function CaseInput() {
  const [activeTab, setActiveTab] = useState("skeleton");
  const [isDraftModalOpen, setDraftModalOpen] = useState(false);

  // Dummy state for file names - you'll need to handle file uploads
  const [fileNames, setFileNames] = useState({
    skeleton: "Chưa chọn file",
    context: "Chưa chọn file",
    personas: "Chưa chọn file",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission logic
    console.log("Form submitted");
  };

  const handleFileSelect = (type) => {
    // This would trigger the hidden file input
    console.log(`Selecting file for ${type}`);
  };

  const handleFileClear = (type) => {
    setFileNames((prev) => ({ ...prev, [type]: "Chưa chọn file" }));
    console.log(`Clearing file for ${type}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800">
      <NavBar />
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary-50 via-white to-slate-100"></div>

      <main className="flex-1 px-6 py-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-12">
          {/* JSON Upload Section */}
          <section className="rounded-3xl border border-dashed border-primary-200 bg-white/80 p-8 shadow-sm">
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-primary-700">
                Nhập dữ liệu từ JSON
              </span>
              <h1 className="text-3xl font-semibold text-slate-900">
                Trang Nhập Case
              </h1>
              <p className="max-w-2xl text-sm text-slate-600">
                Tải lần lượt 3 tệp Skeleton, Context và Personas để tự động điền
                biểu mẫu. Bạn vẫn có thể chỉnh sửa thủ công trước khi lưu case.
              </p>
            </div>
            <div className="mt-6 flex flex-col items-center gap-2 text-center">
              <button
                type="button"
                onClick={() => setDraftModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              >
                Sinh case tự động
              </button>
              <p className="text-xs text-slate-500">
                Nhập prompt tự do hoặc chủ đề chi tiết để hệ thống gợi ý case
                hoàn chỉnh nhanh chóng.
              </p>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {["skeleton", "context", "personas"].map((type) => (
                <div
                  key={type}
                  className="group flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-primary-100 bg-white/70 p-6 text-center transition duration-200 focus-within:border-primary-300 focus-within:shadow hover:border-primary-300 hover:bg-primary-50"
                  tabIndex="0"
                  role="button"
                  aria-label={`Nhập file ${type.charAt(0).toUpperCase() + type.slice(1)} JSON`}
                >
                  <input
                    type="file"
                    accept="application/json"
                    className="hidden"
                  />
                  <span className="text-xs font-semibold uppercase tracking-wide text-primary-700">
                    {type} JSON
                  </span>
                  <p className="text-sm font-semibold text-slate-900">
                    Chọn tệp {type}.json
                  </p>
                  <p className="max-w-[16rem] text-xs text-slate-500">
                    {fileNames[type]}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleFileSelect(type)}
                      className="rounded-full bg-primary-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    >
                      Chọn file
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-primary-200 px-4 py-1.5 text-xs font-semibold text-primary-600 transition hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    >
                      Luu JSON
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFileClear(type)}
                      className="rounded-full border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-500 transition hover:border-slate-300 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Tabs and Panels Section */}
          <section className="space-y-8">
            <div className="flex flex-wrap gap-3" role="tablist">
              {["skeleton", "context", "personas"].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-full border px-5 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-primary-200 ${
                    activeTab === tab
                      ? "border-primary-200 bg-primary-600 text-white shadow hover:bg-primary-500"
                      : "border-primary-200 bg-white text-primary-600 hover:border-primary-300 hover:text-primary-700"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-lg">
              {/* Skeleton Panel */}
              <section
                hidden={activeTab !== "skeleton"}
                className="space-y-8"
              >
                <header className="space-y-1">
                  <h2 className="text-2xl font-semibold text-slate-900">
                    Skeleton
                  </h2>
                  <p className="text-sm text-slate-600">
                    Thông tin tổng quan và danh sách Canon Event.
                  </p>
                </header>
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid gap-4 md:grid-cols-2">{/* Basic skeleton fields go here */}</div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-slate-900">
                        Canon Events
                      </h3>
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-full border border-primary-200 px-4 py-2 text-xs font-semibold text-primary-600 transition hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-200"
                      >
                        + Thêm canon event
                      </button>
                    </div>
                    <div className="space-y-5">{/* Canon events list goes here */}</div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab("context")}
                      className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    >
                      Sang Context →
                    </button>
                  </div>
                </form>
              </section>

              {/* Context Panel */}
              <section
                hidden={activeTab !== "context"}
                className="space-y-8"
              >
                <header className="space-y-1">
                  <h2 className="text-2xl font-semibold text-slate-900">
                    Context
                  </h2>
                  <p className="text-sm text-slate-600">
                    Bối cảnh, resource và điều kiện hiện trường.
                  </p>
                </header>
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Various context fields go here */}
                    <div className="rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-inner">
                        <h3 className="text-base font-semibold text-slate-900">Bối cảnh (Scene)</h3>
                        <div className="mt-4 grid gap-4 md:grid-cols-2">{/* Scene fields */}</div>
                    </div>
                    {/* ... other context sections */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-slate-900">Nguồn lực khả dụng</h3>
                            <button type="button" className="inline-flex items-center gap-2 rounded-full border border-primary-200 px-4 py-2 text-xs font-semibold text-primary-600 transition hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-200">
                                + Thêm nhóm resource
                            </button>
                        </div>
                        <div className="space-y-5">{/* Resources list */}</div>
                    </div>
                  <div className="flex flex-wrap justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab("skeleton")}
                      className="inline-flex items-center gap-2 rounded-full border border-primary-200 px-5 py-2 text-sm font-semibold text-primary-600 transition hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    >
                      ← Về Skeleton
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("personas")}
                      className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    >
                      Sang Personas →
                    </button>
                  </div>
                </form>
              </section>

              {/* Personas Panel */}
              <section
                hidden={activeTab !== "personas"}
                className="space-y-8"
              >
                <header className="space-y-1">
                  <h2 className="text-2xl font-semibold text-slate-900">
                    Personas
                  </h2>
                  <p className="text-sm text-slate-600">
                    Danh sách nhân vật và đặc điểm hành vi.
                  </p>
                </header>
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-slate-900">Danh sách Persona</h3>
                            <button type="button" className="inline-flex items-center gap-2 rounded-full border border-primary-200 px-4 py-2 text-xs font-semibold text-primary-600 transition hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-200">
                                + Thêm persona
                            </button>
                        </div>
                        <div className="space-y-5">{/* Personas list */}</div>
                    </div>
                  <div className="flex flex-wrap justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab("context")}
                      className="inline-flex items-center gap-2 rounded-full border border-primary-200 px-5 py-2 text-sm font-semibold text-primary-600 transition hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    >
                      ← Về Context
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:bg-emerald-400 disabled:opacity-60"
                    >
                      Lưu case
                    </button>
                  </div>
                </form>
              </section>
            </div>
          </section>
        </div>
      </main>

      {/* Draft Modal */}
      {isDraftModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-6 py-8"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setDraftModalOpen(false)}
              className="absolute right-4 top-4 rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-200"
              aria-label="Đóng"
            >
              &#10005;
            </button>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                console.log("Draft form submitted");
                setDraftModalOpen(false);
              }}
              className="space-y-5"
            >
              <header className="space-y-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                  Agent gợi ý case
                </span>
                <h2 className="text-xl font-semibold text-slate-900">
                  Sinh case tự động
                </h2>
                <p className="text-sm text-slate-600">
                  Mô tả chủ đề, nhân vật mong muốn hoặc các chi tiết khác để hệ
                  thống sinh ra skeleton, context và personas tương ứng.
                </p>
              </header>
              <div className="space-y-3">
                <label className="flex flex-col gap-2 text-left">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Prompt tự do
                  </span>
                  <textarea
                    rows="4"
                    placeholder="Ví dụ: Tạo case về khám răng định kỳ với 3 nhân vật: bác sĩ hướng dẫn, điều dưỡng hỗ trợ và bệnh nhân cao tuổi."
                    className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  ></textarea>
                </label>
                <div className="grid gap-3 md:grid-cols-3">
                  <label className="flex flex-col gap-2 text-left">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Chủ đề (tùy chọn)
                    </span>
                    <input
                      type="text"
                      placeholder="VD: Khám răng định kỳ tại phòng khám ABC"
                      className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-left">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Số nhân vật dự kiến
                    </span>
                    <input
                      type="number"
                      min="1"
                      placeholder="Mặc định 3"
                      className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-left">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Địa điểm chính (tùy chọn)
                    </span>
                    <input
                      type="text"
                      placeholder="VD: Phòng khám nha khoa Quận 3"
                      className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                  </label>
                </div>
              </div>
              <footer className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-500"></p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setDraftModalOpen(false)}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  >
                    Sinh case
                  </button>
                </div>
              </footer>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
