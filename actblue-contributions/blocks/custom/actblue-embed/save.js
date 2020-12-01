/**
 * External dependencies
 */
import classnames from "classnames/dedupe";

/**
 * WordPress dependencies
 */
import { RichText } from "@wordpress/block-editor";

const EmbedSave = ({ attributes }) => {
	const { url, caption, type } = attributes;

	if (!url) {
		return null;
	}

	const embedClassName = classnames("wp-block-embed", "is-provider-actblue", {
		[`is-type-${type}`]: type,
	});

	return (
		<figure className={embedClassName}>
			<div className="wp-block-embed__wrapper">
				{`\n${url}\n` /* URL needs to be on its own line. */}
			</div>
			{!RichText.isEmpty(caption) && (
				<RichText.Content tagName="figcaption" value={caption} />
			)}
		</figure>
	);
};

export default EmbedSave;
