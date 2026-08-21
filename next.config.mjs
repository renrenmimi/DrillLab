/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // /exams 的索引页已经并进 /path（「课程」）—— 两页原本在列同一批课程。
  // 保留一条重定向，老链接和书签不会断。
  // 注意 /exams/[examId] 不受影响，它是更深一层的动态路由。
  async redirects() {
    return [{ source: "/exams", destination: "/path", permanent: false }];
  },
};

export default nextConfig;
