import os
import uuid

import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

BASE_URL = os.getenv("SELENIUM_BASE_URL", "http://localhost:5173")
DEMO_PASSWORD = "Selenium123!"


@pytest.fixture
def browser():
    options = webdriver.ChromeOptions()
    options.add_argument("--headless=new")
    options.add_argument("--window-size=1440,1000")
    driver = webdriver.Chrome(options=options)
    driver.implicitly_wait(2)
    yield driver
    driver.quit()


def sign_in(browser):
    browser.get(f"{BASE_URL}/login")
    browser.find_element(By.CSS_SELECTOR, '[data-testid="login-submit"]').click()
    WebDriverWait(browser, 10).until(
        EC.visibility_of_element_located(
            (By.CSS_SELECTOR, '[data-testid="dashboard-page"]')
        )
    )


def test_credentials_accept_valid_and_reject_invalid_login(browser):
    browser.get(f"{BASE_URL}/login")
    browser.find_element(By.ID, "password").send_keys("incorrect-password")
    browser.find_element(By.CSS_SELECTOR, '[data-testid="login-submit"]').click()
    error = WebDriverWait(browser, 10).until(
        EC.visibility_of_element_located(
            (By.CSS_SELECTOR, '[data-testid="login-error"]')
        )
    )
    assert "Invalid email or password" in error.text

    browser.find_element(By.ID, "password").clear()
    browser.find_element(By.ID, "password").send_keys(DEMO_PASSWORD)
    browser.find_element(By.CSS_SELECTOR, '[data-testid="login-submit"]').click()
    WebDriverWait(browser, 10).until(
        EC.visibility_of_element_located(
            (By.CSS_SELECTOR, '[data-testid="dashboard-page"]')
        )
    )


def test_sidebar_navigation_changes_pages(browser):
    sign_in(browser)

    browser.find_element(By.CSS_SELECTOR, '[data-testid="nav-products"]').click()
    WebDriverWait(browser, 10).until(
        EC.visibility_of_element_located(
            (By.CSS_SELECTOR, '[data-testid="products-page"]')
        )
    )
    browser.find_element(By.CSS_SELECTOR, '[data-testid="nav-settings"]').click()
    WebDriverWait(browser, 10).until(
        EC.visibility_of_element_located(
            (By.CSS_SELECTOR, '[data-testid="settings-page"]')
        )
    )
    browser.find_element(By.CSS_SELECTOR, '[data-testid="nav-dashboard"]').click()
    WebDriverWait(browser, 10).until(
        EC.visibility_of_element_located(
            (By.CSS_SELECTOR, '[data-testid="dashboard-page"]')
        )
    )


def test_product_form_validation_creation_and_search(browser):
    sign_in(browser)
    browser.find_element(By.CSS_SELECTOR, '[data-testid="nav-products"]').click()
    WebDriverWait(browser, 10).until(
        EC.visibility_of_element_located(
            (By.CSS_SELECTOR, '[data-testid="products-page"]')
        )
    )
    browser.find_element(
        By.CSS_SELECTOR, '[data-testid="create-product-button"]'
    ).click()

    name_input = browser.find_element(
        By.CSS_SELECTOR, '[data-testid="product-name-input"]'
    )
    assert browser.execute_script("return arguments[0].checkValidity()", name_input) is False

    name = f"Selenium product {uuid.uuid4().hex[:8]}"
    name_input.send_keys(name)
    browser.find_element(
        By.CSS_SELECTOR, '[data-testid="product-category-input"]'
    ).send_keys("Accessories")
    browser.find_element(
        By.CSS_SELECTOR, '[data-testid="product-description-input"]'
    ).send_keys("Added by the Selenium browser scenario.")
    browser.find_element(
        By.CSS_SELECTOR, '[data-testid="product-price-input"]'
    ).send_keys("19.99")
    browser.find_element(
        By.CSS_SELECTOR, '[data-testid="save-product-button"]'
    ).click()

    WebDriverWait(browser, 10).until(
        EC.visibility_of_element_located(
            (By.CSS_SELECTOR, '[data-testid="product-success"]')
        )
    )
    search = browser.find_element(
        By.CSS_SELECTOR, '[data-testid="product-search-input"]'
    )
    search.send_keys(name)
    row = WebDriverWait(browser, 10).until(
        EC.visibility_of_element_located(
            (By.CSS_SELECTOR, '[data-testid="product-row"]')
        )
    )
    assert name in row.text
    browser.find_element(
        By.CSS_SELECTOR, '[data-testid="delete-product-button"]'
    ).click()
    WebDriverWait(browser, 10).until(EC.staleness_of(row))
