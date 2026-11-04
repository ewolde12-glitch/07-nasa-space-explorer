// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const getImagesButton = document.getElementById('getImagesButton');
const gallery = document.getElementById('gallery');
const imageModal = document.getElementById('imageModal');
const closeModalButton = document.getElementById('closeModalButton');
const modalImage = document.getElementById('modalImage');
const modalTitle = document.getElementById('modalTitle');
const modalDate = document.getElementById('modalDate');
const modalExplanation = document.getElementById('modalExplanation');
const randomFact = document.getElementById('randomFact');
const statusMessage = document.getElementById('status');

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);

// Choose a different space fact each time the page loads.
const spaceFacts = [
	"A day on Venus is longer than its year.",
	"Light from the Sun takes about eight minutes to reach Earth.",
	"Jupiter is the largest planet in our solar system.",
	"Saturn's rings are made mostly of ice and rocky material.",
	"The Moon moves about 3.8 centimeters farther from Earth each year.",
	"There are more stars in the universe than grains of sand on Earth."
];

const randomFactLabel = document.createElement('strong');
randomFactLabel.textContent = 'Did you know?';
const randomFactText = document.createElement('span');
randomFactText.textContent = ` ${spaceFacts[Math.floor(Math.random() * spaceFacts.length)]}`;
randomFact.append(randomFactLabel, randomFactText);

function showGalleryMessage(message) {
	statusMessage.textContent = message;
	gallery.replaceChildren();
}

// Render NASA's formatting without trusting arbitrary HTML.
function appendSafeHtml(element, html, safeTags) {
	const parsedHtml = new DOMParser().parseFromString(html || '', 'text/html');
	function copySafeNodes(nodes, parent) {
		Array.from(nodes).forEach((node) => {
			if (node.nodeType === Node.TEXT_NODE) {
				parent.append(document.createTextNode(node.textContent));
				return;
			}

			if (node.nodeType !== Node.ELEMENT_NODE) {
				return;
			}

			const tagName = node.tagName.toLowerCase();
			if (!safeTags.has(tagName)) {
				copySafeNodes(node.childNodes, parent);
				return;
			}

			const safeElement = document.createElement(tagName);
			if (tagName === 'a') {
				try {
					const href = node.getAttribute('href');
					if (!href) {
						copySafeNodes(node.childNodes, parent);
						return;
					}
					const linkUrl = new URL(href, window.location.href);
					if (linkUrl.protocol !== 'http:' && linkUrl.protocol !== 'https:') {
						copySafeNodes(node.childNodes, parent);
						return;
					}
					safeElement.href = linkUrl.href;
					safeElement.target = '_blank';
					safeElement.rel = 'noopener noreferrer';
				} catch {
					copySafeNodes(node.childNodes, parent);
					return;
				}
			}

			copySafeNodes(node.childNodes, safeElement);
			parent.append(safeElement);
		});
	}

	element.replaceChildren();
	copySafeNodes(parsedHtml.body.childNodes, element);
}

function appendExplanation(element, explanation) {
	const explanationTags = new Set(['a', 'b', 'br', 'em', 'i', 'p', 'strong', 'sub', 'sup']);
	appendSafeHtml(element, explanation, explanationTags);
}

function openImageModal(image) {
	modalImage.src = image.hdurl || image.url;
	modalImage.alt = image.title;
	modalTitle.textContent = image.title;
	modalDate.textContent = image.date;
	appendExplanation(modalExplanation, image.explanation);
	imageModal.showModal();
}

function displayImages(images) {
	gallery.replaceChildren();

	if (images.length === 0) {
		showGalleryMessage('No space images were found for this date range.');
		return;
	}

	images.forEach((image) => {
		const isVideo = image.media_type === 'video';
		const galleryItem = document.createElement('article');
		galleryItem.className = 'card';

		if (isVideo) {
			const videoLink = document.createElement('a');
			videoLink.className = 'media-link';
			videoLink.href = image.url;
			videoLink.target = '_blank';
			videoLink.rel = 'noopener noreferrer';
			videoLink.textContent = 'Play APOD video';
			galleryItem.append(videoLink);
		} else {
			const imageLink = document.createElement('button');
			imageLink.className = 'image-link';
			imageLink.type = 'button';
			imageLink.setAttribute('aria-label', `View details for ${image.title}`);
			imageLink.addEventListener('click', () => openImageModal(image));
			const imageElement = document.createElement('img');
			imageElement.src = image.hdurl || image.url;
			imageElement.alt = image.title;
			imageElement.loading = 'lazy';
			imageLink.append(imageElement);
			galleryItem.append(imageLink);
		}

		const cardContent = document.createElement('div');
		cardContent.className = 'card-content';

		const date = document.createElement('p');
		date.className = 'card-date';
		date.textContent = image.date;
		cardContent.append(date);

		const title = document.createElement('p');
		title.className = 'card-title';
		if (isVideo) {
			title.textContent = image.title;
		} else {
			const titleButton = document.createElement('button');
			titleButton.className = 'title-trigger';
			titleButton.type = 'button';
			titleButton.textContent = image.title;
			titleButton.addEventListener('click', () => openImageModal(image));
			title.append(titleButton);
		}
		cardContent.append(title);

		const explanation = document.createElement('div');
		explanation.className = 'explanation';
		appendExplanation(explanation, image.explanation);
		cardContent.append(explanation);

		if (image.copyright) {
			const copyright = document.createElement('p');
			copyright.className = 'copyright';
			copyright.textContent = 'Image credit: ';
			const credit = document.createElement('span');
			const creditTags = new Set(['a', 'br']);
			appendSafeHtml(credit, image.copyright, creditTags);
			copyright.append(credit);
			cardContent.append(copyright);
		}

		galleryItem.append(cardContent);
		gallery.append(galleryItem);
	});

	statusMessage.textContent = `Showing ${images.length} APOD ${images.length === 1 ? 'entry' : 'entries'}.`;
}

function formatQueryDate(dateValue) {
	const [year, month, day] = dateValue.split('-');
	return `${year.slice(-2)}${month}${day}`;
}

async function getSpaceImages() {
	if (!startInput.value || !endInput.value || startInput.value > endInput.value) {
		showGalleryMessage('Choose a valid date range to get space images.');
		return;
	}

	showGalleryMessage('Loading space photos...');

	const apiUrl = new URL('https://science.nasa.gov/wp-json/wp/v2/apod-basic');
	apiUrl.searchParams.set('date_from', formatQueryDate(startInput.value));
	apiUrl.searchParams.set('date_to', formatQueryDate(endInput.value));
	apiUrl.searchParams.set('per_page', '100');

	try {
		const response = await fetch(apiUrl);
		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.msg || 'NASA could not load images for those dates.');
		}

		let images = Array.isArray(data) ? data : [data];
		const totalPages = Number(response.headers.get('X-WP-TotalPages') || 1);

		for (let page = 2; page <= totalPages; page += 1) {
			const pageUrl = new URL(apiUrl);
			pageUrl.searchParams.set('page', page);

			const pageResponse = await fetch(pageUrl);
			const pageData = await pageResponse.json();
			if (!pageResponse.ok) {
				throw new Error(pageData.msg || 'NASA could not load all images for those dates.');
			}

			images = images.concat(Array.isArray(pageData) ? pageData : [pageData]);
		}

		displayImages(images);
	} catch (error) {
		showGalleryMessage(`Unable to load space images: ${error.message}`);
	}
}

getImagesButton.addEventListener('click', getSpaceImages);
closeModalButton.addEventListener('click', () => imageModal.close());

imageModal.addEventListener('click', (event) => {
	if (event.target === imageModal) {
		imageModal.close();
	}
});
