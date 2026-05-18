# CrossCheck - A/H股财报交叉审计工具

智能比对A股与H股财务报告，自动检测数据差异，为审计师构建可信赖的最后一道防线。

## 功能特性

- **PDF 智能解析**：使用 Kimi 大模型自动提取财报中的关键财务数据
- **多维度比对**：覆盖财务核心数据、比率、股份分红、分支机构、文本披露 5 大维度
- **多模型支持**：支持 Kimi、DeepSeek、MiniMax、GLM、千问、豆包等多模型切换
- **数据参照**：集成 TuShare/AKShare 获取上市公司公开数据作为交叉验证
- **审计报告**：自动生成专业审计工作底稿格式报告

## 技术栈

- **前端**：React + TypeScript + Vite + TailwindCSS
- **后端**：Vercel Serverless Functions (Node.js)
- **AI**：Kimi API (文本提取) + Kimi Code API (分析比对) + MiniMax (备选)
- **数据**：TuShare + AKShare

## 部署

### 环境变量 (Vercel)

```
KIMI_API_KEY=your-kimi-api-key
KIMI_CODE_API_KEY=your-kimi-code-api-key
MINIMAX_API_KEY=your-minimax-api-key
TUSHARE_API_TOKEN=your-tushare-token
```

### 本地开发

```bash
pnpm install
pnpm run dev
```

## 许可证

Private - 仅供内部使用
