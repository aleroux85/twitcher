#include "unity.h"
#include "config/config_iterator.h"

/* Optional: Unity setup/teardown */
void setUp(void) {}
void tearDown(void) {}

void test_config_iterator_message_exist(void)
{
    uint8_t buffer1[] = {0x01, 0x00, 0x00, 0x01, 0x01, 0xAA};
    config_element_iterator it1;
    config_element_iterator_init(&it1, buffer1, sizeof(buffer1));
    TEST_ASSERT_TRUE(it1.has_next(&it1));

    uint8_t buffer2[] = {};
    config_element_iterator it2;
    config_element_iterator_init(&it2, buffer2, sizeof(buffer2));
    TEST_ASSERT_FALSE(it2.has_next(&it2));

    uint8_t buffer3[] = {0x01, 0x00, 0x00, 0x01, 0x02, 0xAA};
    config_element_iterator it3;
    config_element_iterator_init(&it3, buffer3, sizeof(buffer3));
    TEST_ASSERT_FALSE(it3.has_next(&it3));

}

void test_config_iterator_detects_message(void)
{
    uint8_t buffer[] = {
        0x01, 0x00, 0x00, 0x01, 0x02, 0xAA, 0xBB
    };

    config_element_iterator it;

    config_element_iterator_init(&it, buffer, sizeof(buffer));

    TEST_ASSERT_TRUE(it.next(&it));

    TEST_ASSERT_EQUAL_UINT8 (0x01, it.type);
    TEST_ASSERT_EQUAL_UINT8 (0x0001, it.id);
    TEST_ASSERT_EQUAL_UINT8 (2, it.len);
    TEST_ASSERT_EQUAL_UINT8 (0xAA, it.pay[0]);
    TEST_ASSERT_EQUAL_UINT32(7, it.pos);

    TEST_ASSERT_FALSE(it.next(&it));
}

void test_config_iterator_multi_message(void)
{
    uint8_t buffer[] = {
        0x01, 0x00, 0x00, 0x01, 0x02, 0xAA, 0xBB,
        0x02, 0x00, 0x00, 0x02, 0x01, 0xCC
    };

    config_element_iterator it;

    config_element_iterator_init(&it, buffer, sizeof(buffer));

    TEST_ASSERT_TRUE(it.next(&it));
    TEST_ASSERT_TRUE(it.next(&it));
    TEST_ASSERT_FALSE(it.next(&it));
}

int main(void)
{
    UNITY_BEGIN();

    RUN_TEST(test_config_iterator_message_exist);
    RUN_TEST(test_config_iterator_detects_message);
    RUN_TEST(test_config_iterator_multi_message);

    return UNITY_END();
}
