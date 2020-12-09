/**
 * Internal dependencies
 */
import { fallback, getAttributesFromPreview } from "./util";
import EmbedControls from "./embed-controls";
import EmbedLoading from "./embed-loading";
import EmbedPlaceholder from "./embed-placeholder";
import EmbedPreview from "./embed-preview";

/**
 * External dependencies
 */
import classnames from "classnames";

/**
 * WordPress dependencies
 */
import { __, sprintf } from "@wordpress/i18n";
import { Component } from "@wordpress/element";
import { compose } from "@wordpress/compose";
import { withSelect, withDispatch } from "@wordpress/data";

import { title, icon } from "./index";

class EmbedEdit extends Component {
	constructor() {
		super(...arguments);
		this.switchBackToURLInput = this.switchBackToURLInput.bind(this);
		this.setUrl = this.setUrl.bind(this);
		this.setMergedAttributes = this.setMergedAttributes.bind(this);
		this.handleIncomingPreview = this.handleIncomingPreview.bind(this);

		this.state = {
			editingURL: false,
			url: this.props.attributes.url,
		};

		if (this.props.preview) {
			this.handleIncomingPreview();
		}
	}

	handleIncomingPreview() {
		this.setMergedAttributes();
	}

	componentDidUpdate(prevProps) {
		const hasPreview = undefined !== this.props.preview;
		const hadPreview = undefined !== prevProps.preview;
		const previewChanged =
			prevProps.preview &&
			this.props.preview &&
			this.props.preview.html !== prevProps.preview.html;
		const switchedPreview = previewChanged || (hasPreview && !hadPreview);
		const switchedURL =
			this.props.attributes.url !== prevProps.attributes.url;

		if (switchedPreview || switchedURL) {
			if (this.props.cannotEmbed) {
				// We either have a new preview or a new URL, but we can't embed it.
				if (!this.props.fetching) {
					// If we're not fetching the preview, then we know it can't be embedded, so try
					// removing any trailing slash, and resubmit.
					this.resubmitWithoutTrailingSlash();
				}
				return;
			}
			this.handleIncomingPreview();
		}
	}

	resubmitWithoutTrailingSlash() {
		this.setState(
			(prevState) => ({
				url: prevState.url.replace(/\/$/, ""),
			}),
			this.setUrl
		);
	}

	setUrl(event) {
		if (event) {
			event.preventDefault();
		}
		const { url } = this.state;
		const { setAttributes } = this.props;
		this.setState({ editingURL: false });
		setAttributes({ url });
	}

	/***
	 * Sets block attributes based on the current attributes and preview data.
	 */
	setMergedAttributes() {
		const { setAttributes } = this.props;
		setAttributes(this.props.attributes);
	}

	switchBackToURLInput() {
		this.setState({ editingURL: true });
	}

	render() {
		const { url, editingURL } = this.state;
		const {
			fetching,
			setAttributes,
			isSelected,
			preview,
			cannotEmbed,
			tryAgain,
		} = this.props;

		if (fetching) {
			return <EmbedLoading />;
		}

		// translators: %s: type of embed e.g: "YouTube", "Twitter", etc. "Embed" is used when no specific type exists
		const label = sprintf(__("%s URL"), title);

		// No preview, or we can't embed the current URL, or we've clicked the edit button.
		if (!preview || cannotEmbed || editingURL) {
			return (
				<EmbedPlaceholder
					icon={icon}
					label={label}
					onSubmit={this.setUrl}
					value={url}
					cannotEmbed={cannotEmbed}
					onChange={(event) =>
						this.setState({ url: event.target.value })
					}
					fallback={() => fallback(url, this.props.onReplace)}
					tryAgain={tryAgain}
				/>
			);
		}

		const { caption, type } = this.props.attributes;
		const className = classnames(
			this.props.attributes.className,
			this.props.className
		);

		return (
			<>
				<EmbedControls
					showEditButton={preview && !cannotEmbed}
					switchBackToURLInput={this.switchBackToURLInput}
				/>
				<EmbedPreview
					preview={preview}
					className={className}
					url={url}
					type={type}
					caption={caption}
					onCaptionChange={(value) =>
						setAttributes({ caption: value })
					}
					isSelected={isSelected}
					icon={icon}
					label={label}
				/>
			</>
		);
	}
}

export default compose(
	withSelect((select, ownProps) => {
		const { url } = ownProps.attributes;
		const core = select("core");
		const {
			getEmbedPreview,
			isPreviewEmbedFallback,
			isRequestingEmbedPreview,
		} = core;
		const preview = undefined !== url && getEmbedPreview(url);
		const previewIsFallback =
			undefined !== url && isPreviewEmbedFallback(url);
		const fetching = undefined !== url && isRequestingEmbedPreview(url);

		// The external oEmbed provider does not exist. We got no type info and no html.
		const badEmbedProvider =
			!!preview && undefined === preview.type && false === preview.html;
		// Some WordPress URLs that can't be embedded will cause the API to return
		// a valid JSON response with no HTML and `data.status` set to 404, rather
		// than generating a fallback response as other embeds do.
		const wordpressCantEmbed =
			!!preview && preview.data && preview.data.status === 404;
		const validPreview =
			!!preview && !badEmbedProvider && !wordpressCantEmbed;
		const cannotEmbed =
			undefined !== url && (!validPreview || previewIsFallback);
		return {
			preview: validPreview ? preview : undefined,
			fetching,
			cannotEmbed,
		};
	}),
	withDispatch((dispatch, ownProps) => {
		const { url } = ownProps.attributes;
		const coreData = dispatch("core/data");
		const tryAgain = () => {
			coreData.invalidateResolution("core", "getEmbedPreview", [url]);
		};
		return {
			tryAgain,
		};
	})
)(EmbedEdit);
