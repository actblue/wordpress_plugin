/**
 *
 * Custom webpack config for block styles/scripts.
 * @see https://developer.wordpress.org/block-editor/packages/packages-scripts/
 */
const defaultConfig = require("@wordpress/scripts/config/webpack.config");

module.exports = {
	...defaultConfig,
	entry: {
		blocks: "./blocks",
		styles: "./blocks/styles.scss",
		editor: "./blocks/editor.scss",
	},
	module: {
		...defaultConfig.module,
		rules: [
			...defaultConfig.module.rules,
			{
				test: /\.scss$/,
				use: [
					{
						loader: "sass-loader",
						options: {
							implementation: require("sass"),
						},
					},
				],
			},
		],
	},
};
