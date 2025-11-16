# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

我在做一个项目，他的核心逻辑都在main.html上面
我想做一个手机端可用的网页，或者说针对手机的网页可以轻松的帮助女性计算内衣尺码。有如下功能
- 支持中文和英文
- 手机友好，所有的都是波轮，比如32D到34C就是32转动到34，D转到C
- 支持不同地区的不同尺码的转换，有一个波轮可以用于切换国家（日本美国中国）
- 然后可以输入上胸围和下胸围来计算出罩杯，选择罩杯的时候也会显示上胸围和下胸围中位数
- 我的3d模型有两个滑块，会根据上面的选项变化
- 手机布局大致上是最上面是类似 Your cup is 然后换行居中很大的两个可以波动的数字比如32C，然后左下一点则是可以滑动的上胸围和下胸围。右下角则是这个可以变动的3d模型
- 我希望这个页面要好看！要有艺术感，我的3d模型也有很多主题，希望可以契合。