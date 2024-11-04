package lee.io.lee.domain.member.enums;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Random;

public enum NicknameType {

    공연_즐기미("공연 즐기미"),
    무대의_주인공("무대의 주인공"),
    페스티벌_러버("페스티벌 러버"),
    음악_애호가("음악 애호가"),
    공연의_달인("공연의 달인"),
    즐길_줄_아는자("즐길 줄 아는자"),
    열정적인_관객("열정적인 관객"),
    무대_체험러("무대 체험러"),
    리듬_타는자("리듬 타는자"),
    무대_속으로("무대 속으로"),
    공연러의_꿈("공연러의 꿈"),
    문화_감상자("문화 감상자"),
    음악_사랑꾼("음악 사랑꾼"),
    무대_매니아("무대 매니아"),
    라이브_즐기미("라이브 즐기미"),
    무대에_빠진자("무대에 빠진자"),
    축제_애호가("축제 애호가"),
    공연_마니아("공연 마니아"),
    즐거움_찾기("즐거움 찾기"),
    무대_사랑자("무대 사랑자"),
    공연_즐기는_사람("공연 즐기는 사람"),
    리듬을_느껴봐("리듬을 느껴봐"),
    음악_덕후("음악 덕후"),
    무대의_팬("무대의 팬"),
    공연_탐험가("공연 탐험가"),
    열광적인_팬("열광적인 팬"),
    무대와_함께("무대와 함께"),
    음악의_주인("음악의 주인"),
    공연_마스터("공연 마스터"),
    무대_매료자("무대 매료자"),
    축제의_중심("축제의 중심"),
    음악_감상러("음악 감상러"),
    공연_속의_나("공연 속의 나"),
    리듬_러버("리듬 러버"),
    무대_즐기는자("무대 즐기는자"),
    음악의_매니아("음악의 매니아"),
    공연_열정러("공연 열정러"),
    축제를_찾는자("축제를 찾는자"),
    음악과_하나("음악과 하나"),
    무대의_광팬("무대의 광팬"),
    공연_즐거움_찾기("공연 즐거움 찾기"),
    리듬에_빠진자("리듬에 빠진자"),
    음악의_즐기미("음악의 즐기미"),
    무대와_노래("무대와 노래"),
    페스티벌_마니아("페스티벌 마니아"),
    공연_속으로("공연 속으로"),
    즐거움을_찾는자("즐거움을 찾는자"),
    음악을_즐기자("음악을 즐기자"),
    무대에서_놀자("무대에서 놀자"),
    공연_좋아하는_사람("공연 좋아하는 사람");

    private final String nickname;

    NicknameType(String nickname) {
        this.nickname = nickname;
    }

    public String getNickname() {
        return nickname;
    }

    private static final List<NicknameType> VALUES = Collections.unmodifiableList(Arrays.asList(values()));
    private static final int SIZE = VALUES.size();
    private static final Random RANDOM = new Random();

    public static String getRandomNickname() {
        return VALUES.get(RANDOM.nextInt(SIZE)).getNickname();
    }
}
