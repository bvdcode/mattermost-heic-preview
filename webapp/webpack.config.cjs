const path = require('node:path');

module.exports = {
    mode: 'production',
    entry: path.resolve(__dirname, 'src/index.tsx'),
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'main.js',
        clean: true,
    },
    resolve: {extensions: ['.ts', '.tsx', '.js']},
    module: {
        rules: [
            {
                test: /\.[jt]sx?$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            ['@babel/preset-env', {targets: {chrome: '100', firefox: '100'}}],
                            ['@babel/preset-react', {runtime: 'classic'}],
                            ['@babel/preset-typescript'],
                        ],
                    },
                },
            },
            {test: /\.css$/, use: ['style-loader', 'css-loader']},
        ],
    },
    externals: {react: 'React', 'react-dom': 'ReactDOM'},
    performance: {hints: 'warning'},
};
