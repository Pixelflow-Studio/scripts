const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = (env, argv) => {
    const isProduction = argv.mode === 'production';
    
    return {
        entry: {
            'ecommerce-reviews': './ecommerce-reviews-optimized.js',
            // Split vendor chunks
            'vendor': ['gsap']
        },
        
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: isProduction ? '[name].[contenthash:8].min.js' : '[name].js',
            chunkFilename: isProduction ? '[name].[contenthash:8].chunk.js' : '[name].chunk.js',
            clean: true,
            // Enable efficient tree shaking
            library: {
                type: 'module'
            },
            environment: {
                module: true
            }
        },
        
        experiments: {
            outputModule: true
        },
        
        optimization: {
            minimize: isProduction,
            minimizer: [
                new TerserPlugin({
                    terserOptions: {
                        compress: {
                            drop_console: isProduction, // Remove console.logs in production
                            drop_debugger: true,
                            pure_funcs: ['console.log', 'console.info', 'console.debug'],
                            passes: 2 // Multiple optimization passes
                        },
                        mangle: {
                            safari10: true
                        },
                        format: {
                            comments: false
                        }
                    },
                    extractComments: false
                })
            ],
            
            // Advanced code splitting
            splitChunks: {
                chunks: 'all',
                cacheGroups: {
                    vendor: {
                        test: /[\\/]node_modules[\\/]/,
                        name: 'vendors',
                        chunks: 'all',
                        priority: 10,
                        reuseExistingChunk: true
                    },
                    common: {
                        name: 'common',
                        minChunks: 2,
                        chunks: 'all',
                        priority: 5,
                        reuseExistingChunk: true,
                        enforce: true
                    },
                    // Separate chunk for large dependencies
                    gsap: {
                        test: /[\\/]node_modules[\\/]gsap[\\/]/,
                        name: 'gsap',
                        chunks: 'all',
                        priority: 20
                    }
                }
            },
            
            // Optimize module concatenation
            concatenateModules: true,
            
            // Enable tree shaking
            providedExports: true,
            usedExports: true,
            sideEffects: false,
            
            // Runtime chunk optimization
            runtimeChunk: {
                name: 'runtime'
            }
        },
        
        resolve: {
            extensions: ['.js', '.mjs'],
            // Optimize module resolution
            modules: ['node_modules'],
            // Use aliases for common paths
            alias: {
                '@': path.resolve(__dirname, './'),
                '@utils': path.resolve(__dirname, './utils'),
                '@config': path.resolve(__dirname, './config')
            }
        },
        
        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: [
                                ['@babel/preset-env', {
                                    targets: {
                                        browsers: ['> 1%', 'last 2 versions']
                                    },
                                    modules: false, // Keep ES modules for better tree shaking
                                    useBuiltIns: 'usage',
                                    corejs: 3
                                }]
                            ],
                            plugins: [
                                // Enable async/await optimization
                                '@babel/plugin-transform-runtime',
                                // Dead code elimination
                                'babel-plugin-transform-remove-console'
                            ]
                        }
                    }
                }
            ]
        },
        
        plugins: [
            // Gzip compression
            ...(isProduction ? [
                new CompressionPlugin({
                    test: /\.(js|css|html|svg)$/,
                    algorithm: 'gzip',
                    threshold: 8192,
                    minRatio: 0.8
                }),
                // Brotli compression for better compression ratio
                new CompressionPlugin({
                    filename: '[path][base].br',
                    algorithm: 'brotliCompress',
                    test: /\.(js|css|html|svg)$/,
                    compressionOptions: {
                        level: 11
                    },
                    threshold: 8192,
                    minRatio: 0.8
                })
            ] : []),
            
            // Bundle analyzer (only when needed)
            ...(process.env.ANALYZE ? [
                new BundleAnalyzerPlugin({
                    analyzerMode: 'static',
                    openAnalyzer: false,
                    reportFilename: 'bundle-analysis.html'
                })
            ] : [])
        ],
        
        // Performance hints
        performance: {
            hints: isProduction ? 'warning' : false,
            maxEntrypointSize: 250000, // 250KB
            maxAssetSize: 250000,
            assetFilter: function(assetFilename) {
                return assetFilename.endsWith('.js');
            }
        },
        
        // Development server configuration
        devServer: {
            contentBase: path.join(__dirname, 'dist'),
            compress: true,
            port: 3000,
            hot: true,
            // Enable HTTP/2 for better performance
            http2: true,
            // Enable caching
            headers: {
                'Cache-Control': 'max-age=31536000'
            }
        },
        
        // Source maps for debugging
        devtool: isProduction ? 'source-map' : 'eval-source-map',
        
        // Stats configuration
        stats: {
            colors: true,
            modules: false,
            children: false,
            chunks: false,
            chunkModules: false,
            entrypoints: false,
            // Show performance timing
            timings: true,
            // Show bundle size information
            assets: true,
            assetsSort: 'size'
        }
    };
};